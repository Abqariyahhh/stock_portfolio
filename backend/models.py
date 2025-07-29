from pydantic import BaseModel, EmailStr

# -------- Alerts --------
class AlertCreate(BaseModel):
    symbol: str
    threshold: float
    email: EmailStr

class AlertResponse(BaseModel):
    id: int
    symbol: str
    threshold: float
    email: EmailStr
    class Config:
        orm_mode = True

# -------- Portfolio --------
class PortfolioCreate(BaseModel):
    symbol: str
    quantity: float
    buy_price: float

class PortfolioResponse(BaseModel):
    id: int
    symbol: str
    quantity: float
    buy_price: float
    class Config:
        orm_mode = True

# -------- Watchlist --------
class WatchlistCreate(BaseModel):
    symbol: str

class WatchlistResponse(BaseModel):
    id: int
    symbol: str
    class Config:
        orm_mode = True
