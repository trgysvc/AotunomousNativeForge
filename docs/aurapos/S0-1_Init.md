{
     "name": "aurapos",
     "private": true,
     "workspaces": [
       "apps/*",
       "packages/*"
     ],
     "scripts": {
       "bootstrap": "npm install",
       "dev": "npm run dev --workspaces",
       "build": "npm run build --workspaces",
       "test": "npm test --workspaces"
     }
   }
   

# Proje kök dizinine gelin
cd /path/to/aurapos

# Bağımlılıkları kök ve tüm workspace paketlerine kurun
npm run bootstrap


npm run dev


# Yeni bir utility paketi oluştur
mkdir -p packages/utils
cd packages/utils
npm init -y   # varsayılan paket.json oluştur
cd ../..      # kök dizinine dön

# Kök package.json'a otomatik eklenmez; workspaces zaten paketi tanır
# Bağımlılık eklemek için:
npm install lodash -w packages/utils