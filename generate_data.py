from app import app
from models import db, User, Expense
import random
from datetime import datetime, timedelta
from flask_bcrypt import Bcrypt

def generate():
    bcrypt = Bcrypt(app)
    with app.app_context():
        db.create_all()
        hashed = bcrypt.generate_password_hash("password").decode('utf-8')
        user = User.query.filter_by(username="testuser").first()
        if not user:
            user = User(username="testuser", password_hash=hashed)
            db.session.add(user)
            db.session.commit()
            
        categories = ['Food', 'Transport', 'Utilities', 'Entertainment', 'Shopping', 'Healthcare', 'Other']
        descriptions = ['Groceries from Market', 'Gas station', 'Monthly Bill', 'Cinema', 'Clothes', 'Pharmacy', 'Miscellaneous']
        
        current_date = datetime.now()
        for i in range(180):
            if random.random() > 0.3:
                num_expenses = random.randint(1, 3)
                for _ in range(num_expenses):
                    days_ago = current_date - timedelta(days=i)
                    expense = Expense(
                        user_id=user.id,
                        amount=round(random.uniform(400.0, 12000.0), 2),
                        category=random.choice(categories),
                        date=days_ago.date(),
                        description=random.choice(descriptions)
                    )
                    db.session.add(expense)
        db.session.commit()
        print("Sample data generated successfully!")
        print("Login credentials -> Username: testuser | Password: password")

if __name__ == '__main__':
    generate()
