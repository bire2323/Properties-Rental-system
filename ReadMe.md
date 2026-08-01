

===========for  Django==============
cd django_backend

python -m venv venv

# Windows
venv\Scripts\activate

pip install django djangorestframework django-cors-headers

django-admin startproject config .

========For frontend react with tailwind=============

cd ..

npm create vite@latest frontend -- --template react
npm install
npm run dev