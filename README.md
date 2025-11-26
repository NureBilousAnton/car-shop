To start the project from this repo:

```bash
# Clone the repo
git clone https://github.com/NureBilousAnton/car-shop
cd car-carshop

# Init the database
docker run --name srbd3 -e POSTGRES_PASSWORD=password -p 5432:5432 -v srbd3:/var/lib/postgresql/data -d postgres
docker exec srbd3 psql -U postgres -c "CREATE DATABASE car_shop;"
docker cp sql/init.sql srbd3:/var/lib/postgresql/data/
docker exec srbd3 psql -U postgres -d car_shop -f /var/lib/postgresql/data/init.sql

# Environment variables
source .envrc

# Compile and execute the program
cargo run
```

Open <http://127.0.0.1:3000/swagger-ui> in your browser.

