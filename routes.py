from flask import request, jsonify, render_template, send_file
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from models import User, Expense, Category
from datetime import datetime
import pandas as pd
from sklearn.linear_model import LinearRegression
import numpy as np
import io

def init_routes(app, db, bcrypt, socketio):

    @app.route('/')
    def index(): return render_template('login.html')
    @app.route('/login')
    def login_page(): return render_template('login.html')
    @app.route('/register')
    def register_page(): return render_template('register.html')
    @app.route('/dashboard')
    def dashboard_page(): return render_template('dashboard.html')
    @app.route('/expenses')
    def expenses_page(): return render_template('expenses.html')

    @app.route('/api/register', methods=['POST'])
    def register():
        data = request.get_json()
        if User.query.filter_by(username=data['username']).first():
            return jsonify({'message': 'User already exists'}), 400
        hashed_password = bcrypt.generate_password_hash(data['password']).decode('utf-8')
        new_user = User(username=data['username'], password_hash=hashed_password)
        db.session.add(new_user)
        db.session.commit()
        return jsonify({'message': 'User created successfully'}), 201

    @app.route('/api/login', methods=['POST'])
    def login():
        data = request.get_json()
        user = User.query.filter_by(username=data['username']).first()
        if user and bcrypt.check_password_hash(user.password_hash, data['password']):
            return jsonify({'token': create_access_token(identity=str(user.id)), 'username': user.username}), 200
        return jsonify({'message': 'Invalid credentials'}), 401

    @app.route('/api/categories', methods=['GET', 'POST', 'DELETE'])
    @jwt_required()
    def handle_categories():
        user_id = int(get_jwt_identity())
        if request.method == 'POST':
            name = request.get_json()['name']
            cat = Category(user_id=user_id, name=name)
            db.session.add(cat)
            db.session.commit()
            return jsonify({'message': 'Category added', 'id': cat.id, 'name': cat.name}), 201
        elif request.method == 'GET':
            cats = Category.query.filter_by(user_id=user_id).all()
            return jsonify([{'id': c.id, 'name': c.name} for c in cats]), 200
        elif request.method == 'DELETE':
            cat_id = request.args.get('id')
            cat = Category.query.filter_by(id=cat_id, user_id=user_id).first()
            if cat:
                db.session.delete(cat)
                db.session.commit()
            return jsonify({'message': 'Category deleted'}), 200

    @app.route('/api/expenses', methods=['GET', 'POST'])
    @jwt_required()
    def handle_expenses():
        current_user_id = int(get_jwt_identity())
        if request.method == 'POST':
            data = request.get_json()
            new_expense = Expense(
                user_id=current_user_id, amount=float(data['amount']), category=data['category'],
                date=datetime.strptime(data['date'], '%Y-%m-%d').date(), description=data.get('description', '')
            )
            db.session.add(new_expense)
            db.session.commit()
            socketio.emit('expense_updated', {'user_id': current_user_id})
            return jsonify({'message': 'Expense added successfully'}), 201
        elif request.method == 'GET':
            expenses = Expense.query.filter_by(user_id=current_user_id).order_by(Expense.date.desc()).all()
            return jsonify([{'id': e.id, 'amount': e.amount, 'category': e.category, 'date': e.date.strftime('%Y-%m-%d'), 'description': e.description} for e in expenses]), 200

    @app.route('/api/expenses/<int:id>', methods=['DELETE', 'PUT'])
    @jwt_required()
    def edit_expense(id):
        current_user_id = int(get_jwt_identity())
        expense = Expense.query.filter_by(id=id, user_id=current_user_id).first()
        if not expense: return jsonify({'message': 'Expense not found'}), 404
        if request.method == 'DELETE':
            db.session.delete(expense)
            db.session.commit()
            socketio.emit('expense_updated', {'user_id': current_user_id})
            return jsonify({'message': 'Expense deleted'}), 200
        elif request.method == 'PUT':
            data = request.get_json()
            expense.amount = float(data['amount'])
            expense.category = data['category']
            expense.date = datetime.strptime(data['date'], '%Y-%m-%d').date()
            expense.description = data.get('description', '')
            db.session.commit()
            socketio.emit('expense_updated', {'user_id': current_user_id})
            return jsonify({'message': 'Expense updated'}), 200

    @app.route('/api/budget', methods=['POST'])
    @jwt_required()
    def update_budget():
        current_user_id = int(get_jwt_identity())
        data = request.get_json()
        user = User.query.get(current_user_id)
        if 'budget' in data:
            user.budget_threshold = float(data['budget'])
            db.session.commit()
            socketio.emit('budget_updated', {'user_id': current_user_id})
            return jsonify({'message': 'Budget updated successfully'}), 200
        return jsonify({'message': 'Invalid data'}), 400

    @app.route('/api/dashboard', methods=['GET'])
    @jwt_required()
    def get_dashboard_data():
        current_user_id = int(get_jwt_identity())
        user = User.query.get(current_user_id)
        expenses = Expense.query.filter_by(user_id=current_user_id).all()
        current_month, current_year = datetime.now().month, datetime.now().year
        monthly_total = sum(e.amount for e in expenses if e.date.month == current_month and e.date.year == current_year)
        total_expenses = sum(e.amount for e in expenses)
        
        category_data = {}
        for e in expenses: category_data[e.category] = category_data.get(e.category, 0) + e.amount
        monthly_data = {}
        for e in expenses:
            month_key = e.date.strftime('%Y-%m')
            monthly_data[month_key] = monthly_data.get(month_key, 0) + e.amount
            
        sorted_months = sorted(monthly_data.keys())
        return jsonify({
            'total_expenses': total_expenses, 'monthly_total': monthly_total, 'budget': user.budget_threshold,
            'category_labels': list(category_data.keys()), 'category_data': list(category_data.values()),
            'monthly_labels': sorted_months, 'monthly_data': [monthly_data[m] for m in sorted_months]
        }), 200

    @app.route('/api/predict', methods=['GET'])
    @jwt_required()
    def predict_budget():
        current_user_id = int(get_jwt_identity())
        expenses = Expense.query.filter_by(user_id=current_user_id).all()
        if not expenses: return jsonify({'predicted': 0, 'message': 'Not enough data.'})
        df = pd.DataFrame([{'amount': e.amount, 'date': e.date} for e in expenses])
        df['date'] = pd.to_datetime(df['date'])
        df['month_year'] = df['date'].dt.to_period('M')
        monthly_totals = df.groupby('month_year')['amount'].sum().reset_index().sort_values('month_year')
        
        if len(monthly_totals) < 2:
            return jsonify({'predicted': round(monthly_totals['amount'].mean(), 2) if not pd.isna(monthly_totals['amount'].mean()) else 0.0, 'message': 'Prediction based on average.'})
            
        model = LinearRegression().fit(np.arange(len(monthly_totals)).reshape(-1, 1), monthly_totals['amount'].values)
        predicted_value = max(0, model.predict(np.array([[len(monthly_totals)]]))[0])
        tip = "Your spending trend is up. Consider reducing non-essential expenses." if predicted_value > monthly_totals['amount'].values[-1] else "Your spending is on a downward trend. Keep it up!"
        return jsonify({'predicted': round(float(predicted_value), 2), 'message': tip})

    @app.route('/api/export', methods=['GET'])
    @jwt_required()
    def export_csv():
        expenses = Expense.query.filter_by(user_id=int(get_jwt_identity())).order_by(Expense.date.desc()).all()
        df = pd.DataFrame([{'Date': e.date.strftime('%Y-%m-%d'), 'Category': e.category, 'Amount': e.amount, 'Description': e.description} for e in expenses])
        output = io.StringIO()
        df.to_csv(output, index=False)
        mem = io.BytesIO()
        mem.write(output.getvalue().encode('utf-8'))
        mem.seek(0)
        return send_file(mem, mimetype='text/csv', as_attachment=True, download_name='expenses_report.csv')
