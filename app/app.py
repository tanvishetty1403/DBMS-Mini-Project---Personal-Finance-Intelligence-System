import os
from flask import Flask
from routes_tanvi import bp as tanvi_bp
# Maansi: from routes_maansi import bp as maansi_bp  -> app.register_blueprint(maansi_bp)

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", "dev-secret-change-me")
app.register_blueprint(tanvi_bp)

if __name__ == "__main__":
    app.run(debug=True)
