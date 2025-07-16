-- Script used to initially create the price_data postgres table

CREATE TABLE price_data (
  ticker    TEXT     NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  open      NUMERIC  NOT NULL,
  high      NUMERIC  NOT NULL,
  low       NUMERIC  NOT NULL,
  close     NUMERIC  NOT NULL,
  volume    BIGINT   NOT NULL,
  PRIMARY KEY (ticker, timestamp)
);

CREATE INDEX idx_price_data_ticker_ts
  ON price_data(ticker, timestamp);