# 💰 PaisaVasool Expense Tracker

Welcome to your new Expense Tracker! This is a web application that helps you track your daily expenses and uses smart prediction to guess your next month's budget.

Don't worry if you are new to programming, follow these simple, beginner-friendly steps to run the application on your computer.

---

## 🛠️ Requirements Check

Before you begin, make sure you have **Python** installed on your computer.

1. Open your Terminal or Command Prompt.
2. Type `python --version` and press Enter.
3. If it shows a version number (like `Python 3.10.x`), you are good to go! If it says something like "command not found", please download and install Python from [python.org](https://www.python.org/).

---

## 🚀 How to Run the App (Step-by-Step for Windows)

### Step 1: Open the Project Folder in your Terminal

1. Open **Command Prompt** or **PowerShell** on your computer.
2. Navigate to where this project is saved by typing this command and pressing Enter:
   ```cmd
   cd C:\HMS\expense-tracker
   ```

### Step 2: Create a Virtual Environment

A virtual environment is like a safe "sandbox" for this project. It makes sure the tools we install don't interfere with other projects on your computer.
Create the sandbox by typing:

```cmd
python -m venv venv
```

Now, turn the sandbox **ON** by typing:

```cmd
    .\venv\Scripts\activate
```

_(You should see the word `(venv)` appear on the left side of your command line now!)_

### Step 3: Install Required Packages

We need some extra code packages (like Flask and Pandas) to make the app work. Install them automatically by typing:

```cmd
pip install -r requirements.txt
```

_(This may take a minute or two to download everything)._

### Step 4: Add Sample Data (Recommended)

To see how the beautiful charts and AI predictions look without typing in hundreds of expenses manually, let's auto-generate 6 months of fake data.
Type:

```cmd
python generate_data.py
```

_This will create a sample account for you with the username **`testuser`** and password **`password`**._

### Step 5: Start the Website Server!

You are finally ready to turn the app on. Type:

```cmd
python app.py
```

If you see text that says `* Running on http://127.0.0.1:5000/`, the server is successfully running!

---

## 🌐 Opening the App

Important: **Leave the black terminal window open** (don't close it, or the website will turn off).

1. Open your favorite web browser (like Google Chrome or Microsoft Edge).
2. Type in this exact web address and press Enter:
   👉 **[http://127.0.0.1:5000/](http://127.0.0.1:5000/)**

Log in using the sample account from earlier:

- **Username**: `testuser`
- **Password**: `password`

---

## 🛑 How to Stop the App

When you are done using the application and want to shut it down:

1. Go back to your Terminal / Command Prompt window where the server is running.
2. Press `Ctrl + C` on your keyboard at the same time to stop the server.
3. Type `deactivate` to turn off your virtual environment sandbox.

If you want to run it again tomorrow, simply open your terminal, type `cd C:\HMS\expense-tracker`, turn the sandbox back on with `.\venv\Scripts\activate`, and start it with `python app.py`!
