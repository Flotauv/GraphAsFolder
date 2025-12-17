// dimensions
const width = 960;
const height = 600;

// URL des data JSON
const dataUrl = '../data/directory.json'; 


function getNodeColor(d, colorScale) {
    if (d.depth === 0) return "rgba(190, 9, 9, 0.1)";

    let ancestor = d;
    while (ancestor.depth > 1) ancestor = ancestor.parent;

    const baseColor = colorScale(ancestor.data.name);
    return d.children ? d3.rgb(baseColor).brighter(0.8) : baseColor;
};



// ========= Fonction principale pour charger les données ==============
d3.json(dataUrl).then(data => {
    // Les données JSON sont chargées dans la variable 'data'

    const root = d3.hierarchy(data)
        .sum(d => d.type === 'file' ? 1 : 0); // Donne une 'valeur' aux nœuds
    
    createTreemap(root);

    //createTree(root);

    createPack(root);
    

}).catch(error => {
    console.error("Erreur lors du chargement des données JSON:", error);
});


// --- Visu 1 : TREEMAP ---
function createTreemap(root) {
    const treemap = d3.treemap()
        .size([width, height])
        .paddingOuter(6)
        .paddingInner(1);

    treemap(root);

    // ÉCHELLE DE COULEURS
    const level1Names = root.children ? root.children.map(d => d.data.name) : [];
    const colorScale = d3.scaleOrdinal()
        .domain(level1Names)
        .range(d3.schemeTableau10);

    const svg = d3.select("#treemap_container")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    // TOOLTIP
    let tooltip = d3.select(".tooltip");
    if (tooltip.empty()) {
        tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("position", "absolute")
            .style("background", "rgba(0,0,0,0.8)")
            .style("color", "white")
            .style("padding", "8px")
            .style("border-radius", "4px")
            .style("pointer-events", "none")
            .style("display", "none")
            .style("font-size", "12px")
            .style("z-index", "1000");
    }

    const cell = svg.selectAll("g")
        .data(root.descendants())
        .join("g")
        .attr("transform", d => `translate(${d.x0},${d.y0})`)

        // --- GESTION DU PASSAGE DE LA SOURIS ---
        .on("mouseover", function(event, d) {
            tooltip.style("display", "block")
                   .html(`
                        <strong>Nom :</strong> ${d.data.name}<br>
                        <strong>Type :</strong> ${d.data.type || 'Dossier'}<br>
                        <strong>Profondeur :</strong> ${d.depth}
                   `);
            
            // Bordure de mise en évidence
            d3.select(this).select("rect")
                .style("stroke", "black")
                .style("stroke-width", 3);
        })
        .on("mousemove", function(event) {
            tooltip.style("left", (event.pageX + 15) + "px")
                   .style("top", (event.pageY - 15) + "px");
        })
        .on("mouseout", function(event, d) {
            tooltip.style("display", "none");
            
            // Retour à la bordure normale
            d3.select(this).select("rect")
                .style("stroke", d.children ? "#555" : "none")
                .style("stroke-width", 1);
        });

    // Couleur des tuilles selon leur racine
    cell.append("rect")
        .attr("class", "tile")
        .attr("width", d => Math.max(0, d.x1 - d.x0))
        .attr("height", d => Math.max(0, d.y1 - d.y0))
        .attr("fill", d => {
            if (d.depth === 0) return "#be090967"; // Profondeur 0 (bordure de la visu)
            
            // Trouver la racine (profondeur = 1)
            let ancestor = d;
            while (ancestor.depth > 1) ancestor = ancestor.parent;
            
            const baseColor = colorScale(ancestor.data.name);
            
            // Dossier = Couleur plus claire / Fichier = Couleur pleine
            return d.children ? d3.rgb(baseColor).brighter(1) : baseColor;
        })
        .attr("stroke", d => d.children ? "#555" : "none");

    // texte afficher avec la souris
    cell.append("text")
        .attr("x", 4)
        .attr("y", 14)
        .style("pointer-events", "none") // Empêche le texte de bloquer le tooltip
        .text(d => {
            const w = d.x1 - d.x0;
            const h = d.y1 - d.y0;
            return (w > 50 && h > 20) ? d.data.name : '';
        })
        .attr("fill", d => d.children ? "#222" : "white")
        .attr("font-size", "10px")
        .style("font-family", "Arial");
}


// ======== Bien penser à remettre le main.js dans le html /////

function createPack(root){

    // Creation du color scale pour le graphique ( à changer après)
    // ÉCHELLE DE COULEURS
    const level1Names = root.children ? root.children.map(d => d.data.name) : [];
    const colorScale = d3.scaleOrdinal()
        .domain(level1Names)
        .range(d3.schemeTableau10);
    
    const container = d3.select("#pack_container");
    container.selectAll("*").remove();

    const pack = d3.pack()
        .size([width - 20, height - 20])
        .padding(3);

    pack(root);

    const svg = container.append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", `0 0 ${width} ${height}`)
        .style("max-width", "100%")
        .style("height", "auto");

    // Ajout d'un graphique dans la section svg 
    const g = svg.append("g")
        .attr("transform", "translate(10, 10)");

    
    // Création des noeuds au niveau des fichiers.
    const nodes = g.selectAll("g")
        .data(root.descendants())
        .join("g")
        .attr("transform", d => `translate(${d.x},${d.y})`)
        .style("opacity", 0)
        .attr("pointer-events", d => !d.children ? "none" : null)
        .on("mouseover", function() { d3.select(this).attr("stroke", "#000"); })
        .on("mouseout", function() { d3.select(this).attr("stroke", null); })
        .on("click", (event, d) => focus !== d && (zoom(event, d), event.stopPropagation()));
    
    // Ajout des fichiers sous forme de cercles
    nodes.append("circle")
        .attr("r", d => d.r)
        .attr("fill", d => getNodeColor(d, colorScale))
        .attr("stroke", d => d.children ? "#fff"  : "none")
        .attr("stroke-width", d => d.children ? 2 : 0)
        .style("opacity", d => d.depth === 0 ? 0 : (d.children ? 0.6 : 0.8));

    // ajout des transitions 
    nodes.transition()
        .duration(750)
        .delay((d, i) => i * 5)
        .style("opacity", 1);

    
    // ajout des noms des fichiers
    // Append the text labels.
    const label = nodes.append("text")
        .attr("text-anchor", "middle")
        .attr("dy", "0.3em")
        .style("font-size", d => Math.min(d.r / 3, 14) + "px")
        .style("fill", "#fff")
        .style("pointer-events", "none")
        .style("font-weight", "600")
        .text(d => d.r > 30 ? d.data.name : '');
    

    return svg.node();
    
    
}