# 📊 Visualisation Interactive de Répertoires

Une application web moderne pour visualiser des structures de répertoires avec **5 visualisations interactives** différentes utilisant D3.js.

![Version](https://img.shields.io/badge/version-2.0-blue)
![D3.js](https://img.shields.io/badge/D3.js-v7-orange)
![License](https://img.shields.io/badge/license-MIT-green)

---

## ✨ Fonctionnalités

### 🎨 5 Visualisations Interactives

1. **Treemap** 🗂️ - Vue rectangulaire hiérarchique
2. **Tree** 🌳 - Dendrogramme arborescent
3. **Pack** ⚪ - Circle packing hiérarchique
4. **Sunburst** 🌞 - Partition radiale
5. **Icicle** ❄️ - Partition verticale (stalactite)

### 🎯 Design Moderne

- **Dark Mode** avec palette de couleurs harmonieuse
- **Glassmorphism** - Effets de transparence et flou
- **Animations fluides** sur toutes les interactions
- **Tooltips élégants** avec informations détaillées
- **Responsive design** - Fonctionne sur desktop et mobile

### 🔧 Interactions

- Survol des éléments pour afficher les détails
- Effets visuels dynamiques
- Statistiques globales (fichiers, dossiers, profondeur)
- Boutons de réinitialisation pour chaque visualisation

---

## 🚀 Démarrage Rapide

### 1. Générer l'arbre de répertoire

Le projet nécessite un fichier JSON représentant la structure d'un répertoire.

```bash
python data/folder-json.py <chemin-du-dossier>
```

**Exemple** pour scanner le répertoire actuel :
```bash
python data/folder-json.py .
```

Cela génère `data/directory.json` qui contient la structure hiérarchique.

### 2. Lancer le serveur local

Depuis la racine du projet :

```bash
python3 -m http.server 8000
```

### 3. Ouvrir l'application

Ouvrez votre navigateur et accédez à :

```
http://localhost:8000/index.html
```

---

## 📁 Structure du Projet

```
GraphAsFolder/
├── index.html          # Page principale
├── styles.css          # Styles modernes (dark mode, glassmorphism)
├── main.js             # Logique des 5 visualisations
├── README.md           # Documentation
├── data/
│   ├── directory.json      # Données JSON générées
│   └── folder-json.py      # Script de génération
├── resources/          # Ressources de démonstration
└── src/               # Anciens fichiers (legacy)
```

---

## 🎨 Technologies Utilisées

- **[D3.js v7](https://d3js.org/)** - Bibliothèque de visualisation
- **HTML5** - Structure sémantique
- **CSS3** - Design moderne avec variables CSS
- **JavaScript (ES6+)** - Logique interactive
- **Python 3** - Génération des données JSON

---

## 📊 Visualisations en Détail

### Treemap 🗂️
Représentation rectangulaire où la taille de chaque rectangle est proportionnelle au nombre de fichiers qu'il contient.

**Avantages** : Vue d'ensemble rapide, comparaison facile des tailles.

### Tree 🌳
Dendrogramme arborescent classique montrant la hiérarchie parent-enfant.

**Avantages** : Structure claire, facile à suivre les chemins.

### Pack ⚪
Cercles imbriqués où chaque cercle représente un dossier ou fichier.

**Avantages** : Esthétique, bonne pour montrer les relations d'inclusion.

### Sunburst 🌞
Partition radiale du centre vers l'extérieur, chaque anneau représente un niveau de profondeur.

**Avantages** : Compact, visuellement attrayant, bon pour les hiérarchies profondes.

### Icicle ❄️
Partition verticale en stalactite, chaque niveau empilé verticalement.

**Avantages** : Utilise bien l'espace vertical, facile à lire de haut en bas.

---

## 🎯 Cas d'Utilisation

- 📂 **Analyse de projets** - Comprendre la structure d'un codebase
- 📊 **Audit de fichiers** - Identifier les dossiers volumineux
- 🎓 **Éducation** - Enseigner les structures de données hiérarchiques
- 🖼️ **Présentation** - Montrer visuellement l'architecture d'un projet

---

## ⚙️ Configuration

### Personnaliser les Couleurs

Modifiez les variables CSS dans `styles.css` :

```css
:root {
    --accent-primary: hsl(210, 100%, 60%);
    --accent-secondary: hsl(280, 100%, 65%);
    /* ... */
}
```

### Ajuster les Dimensions

Dans `main.js`, modifiez la configuration :

```javascript
const config = {
    width: 960,
    height: 600,
    // ...
};
```

### Changer le Schéma de Couleurs D3

```javascript
colorScheme: d3.schemeTableau10  // ou d3.schemeCategory10, etc.
```

---

## 🌐 Compatibilité

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

---

## 📝 Notes

- Les dossiers et fichiers dans `resources/` et `src/com/` sont des **placeholders** pour la démonstration
- Le fichier `test.css` dans `src/` est l'ancien style (legacy)
- Les visualisations utilisent des animations CSS et D3.js pour une performance optimale

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou une pull request.

---

## 📄 License

MIT License - Utilisez librement pour vos projets personnels ou commerciaux.

---

## 👨‍💻 Auteur

Projet de visualisation développé pour l'analyse interactive de structures de répertoires.

