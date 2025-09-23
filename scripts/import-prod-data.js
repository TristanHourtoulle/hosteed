const { exec } = require('child_process');
const fs = require('fs');

// Script pour importer les donnees de prod en gerant les incompatibilites de schema

console.log('Debut de l\'import des donnees de production...');

async function executeCommand(command, description) {
  return new Promise((resolve, reject) => {
    console.log(`[INFO] ${description}...`);
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`[ERROR] ${error.message}`);
        reject(error);
        return;
      }
      if (stderr && !stderr.includes('Warning') && !stderr.includes('NOTICE')) {
        console.error(`⚠️ Avertissement: ${stderr}`);
      }
      console.log(`✅ ${description} terminé`);
      resolve(stdout);
    });
  });
}

async function importProdData() {
  try {
    // 1. Reset de la base locale
    console.log('\n🔄 Phase 1: Reset de la base locale');
    await executeCommand(
      'pnpm prisma db push --force-reset', 
      'Reset de la base de données locale'
    );

    // 2. Import des données par ordre de dépendances pour éviter les erreurs FK
    console.log('\n🔄 Phase 2: Import des données par tables');
    
    // Tables sans dépendances d'abord
    const independentTables = [
      'TypeRent',
      'Equipment', 
      'Services',
      'Security',
      'Meals',
      'IncludedService',
      'ProductExtra',
      'Highlight'
    ];

    for (const table of independentTables) {
      try {
        await executeCommand(
          `docker exec hosteed-db-1 bash -c "PGPASSWORD=jc8zC5gKJkkn4qL pg_dump -h 51.222.87.54 -U hosteeddatabase -d hosteeddb --data-only --table='public.\"${table}\"' --inserts" | docker exec -i hosteed-db-1 psql -U postgres -d hosteed -c "SET session_replication_role = replica;" && cat`,
          `Import de la table ${table}`
        );
      } catch (error) {
        console.log(`⚠️ Table ${table} ignorée (possiblement inexistante en prod)`);
      }
    }

    // 3. Import des utilisateurs (avec nettoyage)
    console.log('\n🔄 Phase 3: Import des utilisateurs');
    await executeCommand(
      `docker exec hosteed-db-1 bash -c "PGPASSWORD=jc8zC5gKJkkn4qL pg_dump -h 51.222.87.54 -U hosteeddatabase -d hosteeddb --data-only --table='public.\"User\"' --inserts" | sed 's/HOST/\\'HOST\\'/g' | sed 's/ADMIN/\\'ADMIN\\'/g' | sed 's/USER/\\'USER\\'/g' | docker exec -i hosteed-db-1 psql -U postgres -d hosteed`,
      'Import des utilisateurs avec correction des enums'
    );

    // 4. Import des produits (avec gestion des erreurs)
    console.log('\n🔄 Phase 4: Import des produits');
    await executeCommand(
      `docker exec hosteed-db-1 bash -c "PGPASSWORD=jc8zC5gKJkkn4qL pg_dump -h 51.222.87.54 -U hosteeddatabase -d hosteeddb --data-only --table='public.\"Product\"' --inserts" | docker exec -i hosteed-db-1 psql -U postgres -d hosteed -v ON_ERROR_STOP=0`,
      'Import des produits (avec tolérance aux erreurs)'
    );

    // 5. Import des images
    console.log('\n🔄 Phase 5: Import des images');
    await executeCommand(
      `docker exec hosteed-db-1 bash -c "PGPASSWORD=jc8zC5gKJkkn4qL pg_dump -h 51.222.87.54 -U hosteeddatabase -d hosteeddb --data-only --table='public.\"Images\"' --inserts" | docker exec -i hosteed-db-1 psql -U postgres -d hosteed -v ON_ERROR_STOP=0`,
      'Import des images'
    );

    // 6. Import des posts
    console.log('\n🔄 Phase 6: Import des posts');
    await executeCommand(
      `docker exec hosteed-db-1 bash -c "PGPASSWORD=jc8zC5gKJkkn4qL pg_dump -h 51.222.87.54 -U hosteeddatabase -d hosteeddb --data-only --table='public.\"Post\"' --inserts" | docker exec -i hosteed-db-1 psql -U postgres -d hosteed -v ON_ERROR_STOP=0`,
      'Import des posts'
    );

    // 7. Vérification des données importées
    console.log('\n🔄 Phase 7: Vérification');
    const userCount = await executeCommand(
      'docker exec hosteed-db-1 psql -U postgres -d hosteed -c "SELECT COUNT(*) FROM \\"User\\";"',
      'Comptage des utilisateurs'
    );
    
    const productCount = await executeCommand(
      'docker exec hosteed-db-1 psql -U postgres -d hosteed -c "SELECT COUNT(*) FROM \\"Product\\";"',
      'Comptage des produits'
    );

    console.log('\n🎉 Import terminé avec succès !');
    console.log(`👥 Utilisateurs importés: ${userCount.match(/\d+/)?.[0] || 'N/A'}`);
    console.log(`🏠 Produits importés: ${productCount.match(/\d+/)?.[0] || 'N/A'}`);

  } catch (error) {
    console.error('❌ Erreur lors de l\'import:', error.message);
    process.exit(1);
  }
}

importProdData();