// Définition des dimensions standard
const width = 960;
const height = 600;

// URL de votre fichier JSON
const dataUrl = 'data.json'; 

// --- Fonction principale pour charger les données ---
d3.json(dataUrl).then(data => {
    // Les données JSON sont chargées dans la variable 'data'
    
    // Assurez-vous d'avoir une propriété 'value' pour le Treemap
    // Le script Python ne l'a pas générée. Si vous voulez un Treemap 
    // qui fonctionne, vous devez calculer la taille des fichiers.
    // Pour cet exemple, on utilisera une valeur bidon (1) pour tous les fichiers.
    const root = d3.hierarchy(data)
        .sum(d => d.type === 'file' ? 1 : 0); // Donne une 'valeur' aux nœuds
    
    createTreemap(root);

    createTreemap(root);

    createPack(root);
    

}).catch(error => {
    console.error("Erreur lors du chargement des données JSON:", error);
});


// --- IMPLÉMENTATION 1 : TREEMAP ---
function createTreemap(root) {
    const treemap = d3.treemap()
        .size([width, height])
        .paddingOuter(1)
        .paddingInner(1);

    treemap(root);
    
    const svg = d3.select("#treemap_container")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g");

    const cell = svg.selectAll("g")
        .data(root.leaves()) // On sélectionne uniquement les feuilles (fichiers)
        .join("g")
        .attr("transform", d => `translate(${d.x0},${d.y0})`);

    // Rectangles (les 'tuiles' du treemap)
    cell.append("rect")
        .attr("class", "tile")
        .attr("width", d => d.x1 - d.x0)
        .attr("height", d => d.y1 - d.y0)
        .attr("fill", d => d.data.type === 'directory' ? '#f0f0f0' : '#4682B4'); // Couleur selon le type

    // Texte (nom du fichier)
    cell.append("text")
        .attr("x", 4)
        .attr("y", 14)
        .text(d => d.data.name)
        .attr("fill", "#333");
        
}
