<h1>Property rental system using React + django</h1>

===========for  Django==============
cd django_backend

python -m venv venv



# Windows
venv\Scripts\activate

pip install django djangorestframework django-cors-headers

django-admin startproject config .
for postgress run: pip install psycopg[binary] python-decouple

========For frontend react with tailwind=============

cd ..

npm create vite@latest frontend -- --template react
npm install
npm run dev


+========  Postgres for database  ==============

psql -U postgres
then: password for postgress
run this: CREATE DATABASE property_rental_db;
check with running this: \l                 // you will see the database property_rental_db

CREATE USER property_rent_user WITH PASSWORD 'postgres123';
GRANT ALL PRIVILEGES ON DATABASE property_rental_db TO property_user;

GRANT ALL PRIVILEGES ON DATABASE property_rental_db TO property_rent_user;
GRANT ALL ON SCHEMA public TO property_rent_user;
ALTER SCHEMA public OWNER TO property_rent_user;

check user with running: \du
// to see the table run: psql -U postgres -d property_rental_db 
//then  run :            \dt