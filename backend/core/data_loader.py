import pandas as pd
import glob
import os
from pathlib import Path
from typing import Optional, List, Dict, Any

class DataLoader:
    def __init__(self, data_dir: str):
        self.data_dir = Path(data_dir)
        # Scan on init
        self.refresh_metadata()
        
    def refresh_metadata(self):
        self.files = list(self.data_dir.glob("*.feather"))
        self.metadata = {} # {symbol: [intervals]}
        
        for f in self.files:
            # Format: cleaned_SYMBOL_USDT_USDT-INTERVAL-futures.feather
            try:
                parts = f.name.split('_')
                if len(parts) < 4: continue
                
                symbol = parts[1]
                # Interval is in the 'USDT-INTERVAL-futures' part usually?
                # Let's look at the sample file names:
                # cleaned_ADA_USDT_USDT-12h-futures.feather
                # parts: ['cleaned', 'ADA', 'USDT', 'USDT-12h-futures.feather']
                
                rest = parts[3] # USDT-12h-futures.feather
                if '-' in rest:
                    interval_part = rest.split('-')[1] # 12h
                    
                    if symbol not in self.metadata:
                        self.metadata[symbol] = set()
                    self.metadata[symbol].add(interval_part)
            except Exception as e:
                print(f"Error parsing file {f.name}: {e}")
                continue

    def get_structure(self) -> Dict[str, List[str]]:
        """
        Returns {symbol: [interval, interval...]}
        """
        return {k: sorted(list(v)) for k, v in self.metadata.items()}

    def get_available_symbols(self) -> List[str]:
        return sorted(list(self.metadata.keys()))

    def load_data(self, symbol: str, interval: str = "1d", start_date: str = None, end_date: str = None) -> pd.DataFrame:
        """
        Load data with date range filtering.
        """
        pattern = f"cleaned_{symbol}_USDT_USDT-{interval}-futures.feather"
        file_path = self.data_dir / pattern
        
        if not file_path.exists():
            raise FileNotFoundError(f"Data file not found: {file_path}")
            
        df = pd.read_feather(file_path)
        
        if 'date' in df.columns:
            df['date'] = pd.to_datetime(df['date'])
            df.set_index('date', inplace=True)
            
        # Filter by Date
        if start_date:
            start_dt = pd.to_datetime(start_date)
            # If index is tz-aware, convert input to that tz (or UTC if simple)
            if df.index.tz is not None:
                if start_dt.tz is None:
                    start_dt = start_dt.tz_localize(df.index.tz)
                else:
                    start_dt = start_dt.tz_convert(df.index.tz)
            df = df[df.index >= start_dt]
            
        if end_date:
            end_dt = pd.to_datetime(end_date)
            if df.index.tz is not None:
                if end_dt.tz is None:
                    end_dt = end_dt.tz_localize(df.index.tz)
                else:
                    end_dt = end_dt.tz_convert(df.index.tz)
            df = df[df.index <= end_dt]
            
        return df

if __name__ == "__main__":
    loader = DataLoader(r"c:/Users/25919/Desktop/google量化/data")
    print("Structure:", loader.get_structure())
