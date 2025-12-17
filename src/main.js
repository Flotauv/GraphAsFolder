// dimensions
const width = 960;
const height = 600;

// URL des data JSON
const dataUrl = '../data/directory.json'; 

// --- Fonction principale pour charger les données ---
d3.json(dataUrl).then(data => {
    // Les données JSON sont chargées dans la variable 'data'

    const root = d3.hierarchy(data)
        .sum(d => d.type === 'file' ? 1 : 0); // Donne une 'valeur' aux nœuds
    
    createTreemap(root);

    displayStats(root);

    createTree(root);

    createPack(root);
    

}).catch(error => {
    console.error("Erreur lors du chargement des données JSON:", error);
});


// calculer les statistiques générales
function calculateStats(root) {
    let fileCount = 0;
    let dirCount = 0;
    let maxDepth = 0;

    root.each(d => {
        if (d.data.type === 'file') fileCount++;
        else if (d.data.type === 'directory') dirCount++;
        if (d.depth > maxDepth) maxDepth = d.depth;
    });

    return { fileCount, dirCount, maxDepth };
}

// Afficher les statistiques
function displayStats(root) {
    const stats = calculateStats(root);
    const statsSection = d3.select("#stats-section");

    statsSection.html(`
        <div class="stat-card">
            <div class="stat-value">${stats.fileCount}</div>
            <div class="stat-label">Fichiers</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${stats.dirCount}</div>
            <div class="stat-label">Dossiers</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${stats.maxDepth}</div>
            <div class="stat-label">Profondeur Max</div>
        </div>
    `);
}

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
