// Définition des dimensions standard
const width = 960;
const height = 600;

// URL de votre fichier JSON
const dataUrl = '../data/directory.json'; 

// --- Fonction principale pour charger les données ---
d3.json(dataUrl).then(data => {
    // Les données JSON sont chargées dans la variable 'data'

    const root = d3.hierarchy(data)
        .sum(d => d.type === 'file' ? 1 : 0); // Donne une 'valeur' aux nœuds
    
    createTreemap(root);

    createTree(root);

    createPack(root);
    

}).catch(error => {
    console.error("Erreur lors du chargement des données JSON:", error);
});


// --- IMPLÉMENTATION 1 : TREEMAP (CORRIGÉE) ---
function createTreemap(root) {
    const treemap = d3.treemap()
        .size([width, height])
        .paddingOuter(6)  // Ajout d'un peu plus de padding extérieur
        .paddingInner(1);

    // D3 calcule les positions (x0, y0, x1, y1) pour chaque nœud
    treemap(root);
    
    const svg = d3.select("#treemap_container")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g");

    const cell = svg.selectAll("g")
        .data(root.descendants())
        .join("g")
        .attr("transform", d => `translate(${d.x0},${d.y0})`);

    // 1. Rectangles (les 'tuiles' du treemap)
    cell.append("rect")
        .attr("class", "tile")
        .attr("width", d => d.x1 - d.x0)
        .attr("height", d => d.y1 - d.y0)
        // Les couleurs sont essentielles pour distinguer les niveaux
        .attr("fill", d => d.children ? "lightblue" : "#4682B4") // Couleur différente pour les dossiers
        .attr("stroke", d => d.children ? "#555" : "none");    

    // 2. Texte (Nom du dossier/fichier)
    cell.append("text")
        .attr("x", 4)
        .attr("y", 14)
        .text(d => {
            // Afficher le nom uniquement si la tuile est assez grande ET si c'est un noeud non-racine
            const rectWidth = d.x1 - d.x0;
            const rectHeight = d.y1 - d.y0;
            if (rectWidth > 30 && rectHeight > 15 && d.depth > 0) { 
                return d.data.name; 
            }
            return '';
        })
        .attr("fill", d => d.children ? "#333" : "white")
        .attr("font-size", "10px");

    // 
}
