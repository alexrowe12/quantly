from data_proc.proc_df import proc_df
from data_proc.calc_indicators import calculate_all_indicators

df = proc_df('./data/data.csv')

print('Data loaded')

for i in df.index:
    values = calculate_all_indicators(df, i)
    for col, val in values.items():
        df.at[i, col] = val

# Probably need to use a sliding window somehow or it'll be incredibly slow
# Maybe can calculate based on the last value? And if there is no last value, run the first calculation