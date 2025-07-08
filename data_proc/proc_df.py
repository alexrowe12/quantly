import pandas as pd

def proc_df(csv_path: str) -> pd.DataFrame:
    print('Reading CSV...')
    df = pd.read_csv(csv_path)

    print('Prepping df...')
    df = df.drop(columns=df.columns[0])
    df['date'] = pd.to_datetime(df['date'], format='%Y%m%d  %H:%M:%S')
    df = df.set_index('date')

    df = df[~df.index.duplicated(keep='first')]
    df.sort_index(inplace=True)

    return df

if __name__ == '__main__':
    df = proc_df('../data/data.csv')
    print('------------------------------')
    print(df.tail())
