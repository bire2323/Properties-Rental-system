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
GRANT ALL PRIVILEGES ON DATABASE property_rental_db TO property_rent_user;

GRANT ALL PRIVILEGES ON DATABASE property_rental_db TO property_rent_user;
GRANT ALL ON SCHEMA public TO property_rent_user;
ALTER SCHEMA public OWNER TO property_rent_user;

check user with running: \du
// to see the table run: psql -U postgres -d property_rental_db 
//then  run :            \dt

## shadcn/ui Installation

This project uses **shadcn/ui** for reusable and modern UI components.

Install shadcn/ui:

npx shadcn@latest init


Add shadcn/ui components:


npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu
npx shadcn@latest add input
npx shadcn@latest add table


Installed shadcn/ui dependencies:

* shadcn/ui
* Base UI
* Tailwind CSS
* class-variance-authority
* clsx
* tailwind-merge
* tw-animate-css
* Lucide React


<h1>FOR DJANGO IT IS VERY NECCESSARY !!!!! </h1>
// django lay adis liberary install stadergi push kemadregsh befit run :
pip freeze > requirements.txt

// django lay update yehone file pull snaderg run:
pip install -r requirements.txt
npm install @react-oauth/google



//install this for react router
 
 
 npm install react-router-dom

 ## Backend media storage (Cloudinary)

 The Django backend stores new public images in Cloudinary and stores identity
 and verification documents as authenticated Cloudinary assets. Configure these
 server-side environment variables for both local Django and Render:

 - `CLOUDINARY_CLOUD_NAME`
 - `CLOUDINARY_API_KEY`
 - `CLOUDINARY_API_SECRET`
 - `CLOUDINARY_PRIVATE_URL_TTL` (optional; defaults to `300` seconds)

 Never add Cloudinary credentials to the React/Vite environment or frontend
 bundle. Public listing and profile images are returned as Cloudinary URLs.
 Private identity files are available only to authorized API users and use
 short-lived signed delivery URLs.

 ### Local checks and legacy-file backfill

 From the repository root in PowerShell:

 ```powershell
 Set-Location .\django_Backend
 .\venv\Scripts\Activate.ps1
 python manage.py check
 python manage.py makemigrations --check --dry-run
 python manage.py migrate
 python manage.py backfill_cloudinary --dry-run
 ```

 Review the dry-run report, then upload any remaining legacy files with:

 ```powershell
 python manage.py backfill_cloudinary
 ```

 The backfill updates database references only after each successful Cloudinary
 upload and deliberately retains local files. It can be limited to one Django
 app with `--app <app_label>` or a bounded batch with `--limit <count>`. Run it
 only where the old files are still present under `MEDIA_ROOT`; a database
 migration cannot recover files already lost from an ephemeral Render
 filesystem.

 ### Render deployment

 1. Add the Cloudinary environment variables above in the Render service
    settings. Keep `CLOUDINARY_API_SECRET` private and server-side.
 2. Back up the Supabase database and preserve any legacy media files before
    replacing or restarting the service that currently holds them.
 3. Deploy the backend, then run `python manage.py migrate`.
 4. Run `python manage.py backfill_cloudinary --dry-run` in an environment
    containing the preserved legacy files; inspect its output before running
    `python manage.py backfill_cloudinary`.
 5. Verify the public image fields and authorized private-document endpoints
    before removing any separately preserved legacy files.
