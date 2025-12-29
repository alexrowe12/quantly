# Processes the initial csv into a clean dataframe

import pandas as pd
import logging

logger = logging.getLogger(__name__)

def proc_df(csv_path: str) -> pd.DataFrame:
    logger.info('Reading CSV...')
    df = pd.read_csv(csv_path)

    logger.info('Prepping df...')
    df = df.drop(columns=df.columns[0])
    df['date'] = pd.to_datetime(df['date'], format='%Y%m%d  %H:%M:%S')
    df = df.set_index('date')

    df = df[~df.index.duplicated(keep='first')]
    df.sort_index(inplace=True)

    return df

# Logic for when this script is run directly
if __name__ == '__main__':
    df = proc_df('../data/data.csv')
    print('------------------------------')
    print(df.tail())
