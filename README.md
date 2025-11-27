To start the project from this repo:

```bash
# Clone the repo
git clone https://github.com/NureBilousAnton/car-shop
cd car-shop

# Init the database
docker run --name srbd3 -e POSTGRES_PASSWORD=password -p 5432:5432 -v srbd3:/var/lib/postgresql/data -d postgres
sleep 2;
docker exec srbd3 psql -U postgres -c "CREATE DATABASE car_shop;"
docker cp sql/init.sql srbd3:/var/lib/postgresql/data/
docker exec srbd3 psql -U postgres -d car_shop -f /var/lib/postgresql/data/init.sql

# Get environment variables (optional)
source .envrc

# Compile and execute the backend
cargo run

# Bootstrap and start the website
cd frontend
npm install
npm run dev
```

- Website is at <http://localhost:3002>
- Swagger is at <http://localhost:3000/swagger-ui>
- OpenAPI spec is at <http://localhost:3000/apidoc/openapi.json>

