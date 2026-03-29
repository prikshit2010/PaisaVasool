from flask import Flask
from models import db
from routes import init_routes
from flask_jwt_extended import JWTManager
from flask_bcrypt import Bcrypt
from flask_cors import CORS
from flask_socketio import SocketIO

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///expense_tracker.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = 'super-secret-key-change-in-production'

db.init_app(app)
jwt = JWTManager(app)
bcrypt = Bcrypt(app)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

init_routes(app, db, bcrypt, socketio)

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    socketio.run(app, debug=True, port=5000, allow_unsafe_werkzeug=True)
