import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.db import connection

tables_to_drop = [
    'interactions_favorite',
    'interactions_propertyrating',
    'properties_propertyimage',
    'properties_feature_properties',
    'properties_property_features',
    'properties_feature',
    'properties_car',
    'properties_house',
    'properties_cardetail',
    'properties_housedetail',
    'properties_property'
]

with connection.cursor() as cursor:
    cursor.execute("DELETE FROM django_migrations WHERE app='properties' OR app='interactions';")
    for table in tables_to_drop:
        try:
            cursor.execute(f"DROP TABLE IF EXISTS {table} CASCADE;")
            print(f"Dropped {table}")
        except Exception as e:
            print(f"Failed to drop {table}: {e}")
            
print("Database reset for properties and interactions.")
