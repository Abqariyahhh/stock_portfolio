from fastapi import FastAPI, Depends, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import requests
import asyncio
from twilio.rest import Client
import smtplib
from email.mime.text import MIMEText
import matplotlib.pyplot as plt
import io
import base64
import os
from dotenv import load_dotenv
from database import SessionLocal, Alert, Portfolio, Watchlist
from models import AlertCreate, AlertResponse, PortfolioCreate, PortfolioResponse, WatchlistCreate, WatchlistResponse

load_dotenv()
# ---------------- CONFIG ----------------
API_KEY = os.getenv("API_KEY")  # Finnhub API key
TWILIO_SID = "your_twilio_sid"
TWILIO_TOKEN = "your_twilio_auth_token"
TWILIO_PHONE = "+1234567890"   # Your Twilio phone number
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
EMAIL_SENDER = "your_email@gmail.com"
EMAIL_PASSWORD = "your_email_password"

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # or ["http://localhost:3000"] for stricter security
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- DB DEPENDENCY ----------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ---------------- HELPERS ----------------
def get_price(symbol: str):
    url = f"https://finnhub.io/api/v1/quote?symbol={symbol}&token={API_KEY}"
    data = requests.get(url).json()
    return data.get("c", 0.0)  # current price

def send_email_alert(to_email, subject, body):
    # Dummy email sending for development
    print(f"[DEBUG EMAIL] To: {to_email}, Subject: {subject}, Body: {body}")

    

def send_sms_alert(to_number, message):
    client = Client(TWILIO_SID, TWILIO_TOKEN)
    client.messages.create(body=message, from_=TWILIO_PHONE, to=to_number)

# ---------------- ROUTES ----------------
@app.get("/")
def root():
    return {"message": "Stock Alert API is running (Finnhub)"}

# -------- Alerts --------
@app.post("/alerts/", response_model=AlertResponse)
def create_alert(alert: AlertCreate, db: Session = Depends(get_db)):
    new_alert = Alert(symbol=alert.symbol.upper(), threshold=alert.threshold, email=alert.email)
    db.add(new_alert)
    db.commit()
    db.refresh(new_alert)
    return new_alert

@app.get("/check_alerts")
def check_alerts(db: Session = Depends(get_db)):
    alerts = db.query(Alert).all()
    triggered = []
    for alert in alerts:
        # Use Finnhub API instead of Alpha Vantage
        url = f"https://finnhub.io/api/v1/quote?symbol={alert.symbol}&token={API_KEY}"
        response = requests.get(url).json()
        price = response.get("c")  # current price
        if not price:
            continue
        if price >= alert.threshold:
            msg = f"ALERT: {alert.symbol} has crossed {alert.threshold}. Current price: {price}"
            send_email_alert(alert.email, "Stock Alert", msg)
            triggered.append({"symbol": alert.symbol, "price": price, "email": alert.email})
    return {"triggered_alerts": triggered}
# -------- Price --------
@app.get("/price/{symbol}")
def get_stock_price(symbol: str):
    price = get_price(symbol)
    return {"symbol": symbol.upper(), "price": price}

# -------- Portfolio --------
@app.post("/portfolio/", response_model=PortfolioResponse)
def add_stock_to_portfolio(stock: PortfolioCreate, db: Session = Depends(get_db)):
    # Check if stock already exists
    existing = db.query(Portfolio).filter(Portfolio.symbol == stock.symbol.upper()).first()
    
    if existing:
        # Update average buy price
        total_quantity = existing.quantity + stock.quantity
        existing.buy_price = ((existing.buy_price * existing.quantity) + (stock.buy_price * stock.quantity)) / total_quantity
        existing.quantity = total_quantity
        db.commit()
        db.refresh(existing)
        return existing
    else:
        # Add new stock
        entry = Portfolio(symbol=stock.symbol.upper(), quantity=stock.quantity, buy_price=stock.buy_price)
        db.add(entry)
        db.commit()
        db.refresh(entry)
        return entry

@app.get("/portfolio/")
def get_portfolio(db: Session = Depends(get_db)):
    stocks = db.query(Portfolio).all()

    # Aggregate by symbol
    merged = {}
    for stock in stocks:
        price = get_price(stock.symbol)
        if stock.symbol not in merged:
            merged[stock.symbol] = {
                "symbol": stock.symbol,
                "quantity": stock.quantity,
                "buy_price": stock.buy_price,
                "current_price": price
            }
        else:
            # Weighted avg buy price
            total_qty = merged[stock.symbol]["quantity"] + stock.quantity
            merged[stock.symbol]["buy_price"] = (
                merged[stock.symbol]["buy_price"] * merged[stock.symbol]["quantity"]
                + stock.buy_price * stock.quantity
            ) / total_qty
            merged[stock.symbol]["quantity"] = total_qty
            merged[stock.symbol]["current_price"] = price  # latest price used

    # Calculate P/L and returns
    details, total_value, total_cost = [], 0, 0
    for s in merged.values():
        value = s["current_price"] * s["quantity"]
        cost = s["buy_price"] * s["quantity"]
        profit_loss = value - cost
        returns = ((value - cost) / cost * 100) if cost else 0
        total_value += value
        total_cost += cost
        details.append({
            **s,
            "profit_loss": profit_loss,
            "returns": returns
        })

    total_profit_loss = total_value - total_cost
    total_return_percent = ((total_value - total_cost) / total_cost * 100) if total_cost else 0

    return {
        "total_value": total_value,
        "total_profit_loss": total_profit_loss,
        "total_return_percent": total_return_percent,
        "details": details
    }


# -------- Portfolio Analytics (Top Gainer & Loser) --------
@app.get("/portfolio/analytics")
def portfolio_analytics(db: Session = Depends(get_db)):
    stocks = db.query(Portfolio).all()
    analytics = []
    for stock in stocks:
        price = get_price(stock.symbol)
        profit_loss = (price - stock.buy_price) * stock.quantity
        analytics.append((stock.symbol, profit_loss))
    sorted_stocks = sorted(analytics, key=lambda x: x[1], reverse=True)
    return {
        "top_gainer": sorted_stocks[0] if sorted_stocks else None,
        "top_loser": sorted_stocks[-1] if sorted_stocks else None
    }

# -------- Portfolio Diversification (Pie Chart) --------
@app.get("/portfolio/diversification")
def portfolio_diversification(db: Session = Depends(get_db)):
    stocks = db.query(Portfolio).all()
    labels = [stock.symbol for stock in stocks]
    values = [get_price(stock.symbol) * stock.quantity for stock in stocks]  # updated
    fig, ax = plt.subplots()
    ax.pie(values, labels=labels, autopct='%1.1f%%')
    buf = io.BytesIO()
    plt.savefig(buf, format="png")
    buf.seek(0)
    img_base64 = base64.b64encode(buf.read()).decode()
    return {"chart": img_base64}

# -------- Watchlist --------
@app.post("/watchlist/", response_model=WatchlistResponse)
def add_to_watchlist(stock: WatchlistCreate, db: Session = Depends(get_db)):
    symbol = stock.symbol.upper()
    existing = db.query(Watchlist).filter(Watchlist.symbol == symbol).first()
    if existing:
        return existing
    entry = Watchlist(symbol=symbol)
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry

@app.get("/watchlist/")
def get_watchlist(db: Session = Depends(get_db)):
    watchlist = db.query(Watchlist).all()
    details = []
    for stock in watchlist:
        current_price = get_price(stock.symbol)
        details.append({"symbol": stock.symbol, "price": current_price})
    return {"watchlist": details}

# -------- Stock Search --------
@app.get("/search/{keyword}")
def search_stock(keyword: str):
    url = f"https://finnhub.io/api/v1/search?q={keyword}&token={API_KEY}"
    res = requests.get(url).json()
    results = [{"symbol": m["symbol"], "name": m["description"]} for m in res.get("result", [])]
    return {"results": results}

# -------- WebSocket (Live Price) --------
@app.websocket("/ws/{symbol}")
async def websocket_endpoint(websocket: WebSocket, symbol: str):
    await websocket.accept()
    try:
        while True:
            price = get_price(symbol)
            await websocket.send_json({"symbol": symbol, "price": price})
            await asyncio.sleep(10)
    except WebSocketDisconnect:
        pass
