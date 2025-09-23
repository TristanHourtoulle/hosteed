#!/bin/bash

echo "=== Import des donnees de production ==="

# 1. Reset de la base locale
echo "1. Reset de la base locale..."
pnpm prisma db push --force-reset

# 2. Import des utilisateurs en premier
echo "2. Import des utilisateurs..."
docker exec hosteed-db-1 bash -c "PGPASSWORD=jc8zC5gKJkkn4qL pg_dump -h 51.222.87.54 -U hosteeddatabase -d hosteeddb --data-only --table='public.\"User\"' --inserts" | docker exec -i hosteed-db-1 psql -U postgres -d hosteed -v ON_ERROR_STOP=0

# 3. Import des TypeRent
echo "3. Import des TypeRent..."
docker exec hosteed-db-1 bash -c "PGPASSWORD=jc8zC5gKJkkn4qL pg_dump -h 51.222.87.54 -U hosteeddatabase -d hosteeddb --data-only --table='public.\"TypeRent\"' --inserts" | docker exec -i hosteed-db-1 psql -U postgres -d hosteed -v ON_ERROR_STOP=0

# 4. Import des Equipment
echo "4. Import des Equipment..."
docker exec hosteed-db-1 bash -c "PGPASSWORD=jc8zC5gKJkkn4qL pg_dump -h 51.222.87.54 -U hosteeddatabase -d hosteeddb --data-only --table='public.\"Equipment\"' --inserts" | docker exec -i hosteed-db-1 psql -U postgres -d hosteed -v ON_ERROR_STOP=0

# 5. Import des Services
echo "5. Import des Services..."
docker exec hosteed-db-1 bash -c "PGPASSWORD=jc8zC5gKJkkn4qL pg_dump -h 51.222.87.54 -U hosteeddatabase -d hosteeddb --data-only --table='public.\"Services\"' --inserts" | docker exec -i hosteed-db-1 psql -U postgres -d hosteed -v ON_ERROR_STOP=0

# 6. Import des Security
echo "6. Import des Security..."
docker exec hosteed-db-1 bash -c "PGPASSWORD=jc8zC5gKJkkn4qL pg_dump -h 51.222.87.54 -U hosteeddatabase -d hosteeddb --data-only --table='public.\"Security\"' --inserts" | docker exec -i hosteed-db-1 psql -U postgres -d hosteed -v ON_ERROR_STOP=0

# 7. Import des Meals
echo "7. Import des Meals..."
docker exec hosteed-db-1 bash -c "PGPASSWORD=jc8zC5gKJkkn4qL pg_dump -h 51.222.87.54 -U hosteeddatabase -d hosteeddb --data-only --table='public.\"Meals\"' --inserts" | docker exec -i hosteed-db-1 psql -U postgres -d hosteed -v ON_ERROR_STOP=0

# 8. Import des Products (plus tard, après les dépendances)
echo "8. Import des Products..."
docker exec hosteed-db-1 bash -c "PGPASSWORD=jc8zC5gKJkkn4qL pg_dump -h 51.222.87.54 -U hosteeddatabase -d hosteeddb --data-only --table='public.\"Product\"' --inserts" | docker exec -i hosteed-db-1 psql -U postgres -d hosteed -v ON_ERROR_STOP=0

# 9. Import des Images
echo "9. Import des Images..."
docker exec hosteed-db-1 bash -c "PGPASSWORD=jc8zC5gKJkkn4qL pg_dump -h 51.222.87.54 -U hosteeddatabase -d hosteeddb --data-only --table='public.\"Images\"' --inserts" | docker exec -i hosteed-db-1 psql -U postgres -d hosteed -v ON_ERROR_STOP=0

# 10. Verification des donnees importees
echo "10. Verification..."
echo "Utilisateurs:"
docker exec hosteed-db-1 psql -U postgres -d hosteed -c "SELECT COUNT(*) FROM \"User\";"

echo "Produits:"
docker exec hosteed-db-1 psql -U postgres -d hosteed -c "SELECT COUNT(*) FROM \"Product\";"

echo "=== Import termine ==="