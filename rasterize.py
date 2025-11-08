import pandas as pd
import numpy as np
import rasterio
from rasterio.transform import from_origin

# ---------------------------
# 1. Load CSV
# ---------------------------
df = pd.read_csv("STATENT_2023.csv", sep=';')  # semicolon separator
df.columns = df.columns.str.strip()  # remove spaces
print("Columns:", df.columns.tolist())
print('Min score:', df['score'].min())
print('Max score:', df['score'].max())
print('Mean score:', df['score'].mean())

# ---------------------------
# 2. Create grid
# ---------------------------
# Get unique coordinates
x_coords = np.sort(df['E_KOORD'].unique())
y_coords = np.sort(df['N_KOORD'].unique())

# Pivot table: rows = N_KOORD, columns = E_KOORD, values = score
# Fill missing cells with NaN to handle edges correctly
grid = df.pivot(index='N_KOORD', columns='E_KOORD', values='score').values

# Flip y-axis because raster origin is top-left
grid = np.flipud(grid)

# ---------------------------
# 3. Raster transform
# ---------------------------
# Top-left corner
# Each cell is 100 m, so adjust by half cell (50 m)
transform = from_origin(x_coords.min() - 50, y_coords.max() + 50, 100, 100)

# ---------------------------
# 4. Save raster
# ---------------------------
with rasterio.open(
    "hectometric_map11.tif",
    "w",
    driver="GTiff",
    height=grid.shape[0],
    width=grid.shape[1],
    count=1,
    dtype=grid.dtype,
    crs="EPSG:2056",
    transform=transform,
    nodata=np.nan  # missing cells stay transparent / NoData
) as dst:
    dst.write(grid, 1)

print("Hectometric raster saved as 'hectometric_map.tif'")
