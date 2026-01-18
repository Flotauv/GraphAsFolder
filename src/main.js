// dimensions
const width = 1600;
const height = 600;

const config = {
    width: 1600,
    height: 600,
    dataUrl: './data/directory.json',
    colorScheme: d3.schemeTableau10,
    transitionDuration: 750,
    // jouer avec les contrastes
    range_color : [
        "hsla(122, 39%, 49%, 1.00)",
        "hsla(207, 90%, 54%, 1.00)",
        "hsla(36, 100%, 50%, 1.00)",
        "hsla(340, 82%, 52%, 1.00)",
        "hsla(187, 100%, 42%, 1.00)",
        "hsla(291, 64%, 42%, 1.00)",
        "hsla(54, 100%, 62%, 1.00)",
        "hsla(16, 25%, 38%, 1.00)",
    ],
    premier_bleu: "hsla(220, 15%, 10%, 1.00)",
    second_bleu: "hsla(220, 15%, 15%, 1.00)",
    gris_fond: "hsla(204, 196, 196, 1.00)",
    white_title: "hsla(0, 1%, 70%, 1.00)",
    white: "hsla(0, 4%, 68%, 1.00)",

    
};

// URL des data JSON
const dataUrl = '../data/directory.json'; 

// Fonctions 

function getNodeColor(d, colorScale) {
    if (d.depth === 0) return "rgba(190, 9, 9, 0.1)";

    let ancestor = d;
    while (ancestor.depth > 1) ancestor = ancestor.parent;

    const baseColor = colorScale(ancestor.data.name);
    return d.children ? d3.rgb(baseColor).brighter(0.8) : baseColor;
};

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

// =============== Visualisation 1 : TREEMAP ================
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
        .range(config.range_color);

    const svg = d3.select("#treemap_container")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        
    let tooltip = d3.select(".tooltip");
    if (tooltip.empty()) {
        tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("position", "absolute")
            .style("background", "rgba(9, 42, 117, 0.96)")
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
            if (d.depth === 0) return "#270b6fbd"; // Profondeur 0 (bordure de la visu)
            
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
// =============== Visualisation 2 : TREE ================
function createTree(root) {

        const dx = 30;
        const dy = 380;
        let infoTimeout;

        const tree = d3.tree().nodeSize([dx, dy]);
        root.sort((a, b) => d3.ascending(a.data.name, b.data.name));

        // Ajout échelle couleurs
        const colorScale = d3.scaleOrdinal()
            .domain(d3.range(root.height +1))
            .range(config.range_color);

        // container
        const svg = d3.select("#tree_container").append("svg")
            .style("height", config.height)
            .style("widht", config.width)


        const g = svg.append("g");
        const linkGroup = g.append("g").attr("class", "links");
        const nodeGroup = g.append("g").attr("class", "nodes");


        // Fonction update pour relier les noeuds entre eux //
        function update(source) {
            const duration = 750;
            //
            const nodes = root.descendants();
    
            const margin = { top: 40, right: 120, bottom: 40, left: 120};

            tree(root);

            let minX = Infinity;
            let maxX = -Infinity;
            root.each(d => {
                if (d.x < minX) minX = d.x;
                if (d.x > maxX) maxX = d.x;
            })

            const height = maxX - minX + margin.top + margin.bottom;
            const width = root.height * dy + margin.left + margin.right;

            // Permet au graphique d'être centré et d'adapter sa taille aux changements de l'utilisateur (ajout dossier/fichier ...)
            svg.transition()
                .duration(duration)
                .attr("viewBox", `0 0 ${width} ${height}`);
            g.attr("transform", `translate(${margin.left}, ${margin.top - minX})`);

            // Links
            const links = g.selectAll(".link")
                .data(root.links())
                .join("path")
                .attr("class", "link")
                .attr("d", d3.linkHorizontal()
                    .x(d => d.y)
                    .y(d => d.x))
                .style("stroke", config.range_color[1])
                .style("stroke-width", 2)
                .style("opacity", 0);

            links.transition()
                .duration(config.transitionDuration)
                .style("opacity", 0.4);

        
            // Noeuds
            const node = nodeGroup.selectAll("g.node").data(nodes, d => d.id);
            const nodeEnter = node.enter().append("g")
                .attr("class", "node")
                .attr("transform", d => `translate(${source.y0 || source.y}, ${source.x0 || source.x})`);
            
            nodeEnter.append("circle")
                .attr("r", 1e-6)
                .style("fill", d => config.range_color[d.depth % config.range_color.length])
                .on("mouseenter", (event, d) => {
                    d3.select(event.currentTarget).select("circle").attr("stroke", "#ff6b6b").attr("stroke-width", 3);
                })
                .on("mouseleave", (event, d) => {
                    d3.select(event.currentTarget).select("circle").attr("stroke", null).attr("stroke-width", null);
                });
            
            nodeEnter.append("text")
                .attr("dy", "0.35em")
                .style("fill", config.white)
                .style("font-weight", "bold")
                .style("font-size", "20px")
                .style("opacity", 0);
            
            const nodeUpdate = node.merge(nodeEnter);

            nodeUpdate.transition()
                .duration(duration)
                .attr("transform", d => `translate(${d.y}, ${d.x})`);
            
            nodeUpdate.select("circle")
            .transition()
            .duration(duration)
            .attr("r", 8)

            nodeUpdate.select("text")
                .transition()
                .duration(duration)
                .attr("x", d => d.children ? -15 : 15)
                .attr("text-anchor", d => d.children ? "end" : "start")
                .style("opacity", 1)
                .text(d => d.data.name);
            
            const nodeExit = node.exit().transition()
                .duration(duration)
                .attr("transform", d => `translate(${source.y}, ${source.x})`)
                .style("opacity", 1e-6)
                .remove();
            
            nodeExit.select("circle").attr("r", 1e-6);
            nodeExit.select("text").style("fill-opacity", 1e-6);

            nodes.forEach(d => {
                d.x0 = d.x;
                d.y0 = d.y;
            });
        }

        //! =========== Initial Render ===========
        root.x0 = dy / 2;
        root.y0 = 0;
        let i = 0;
        update(root);
    }


// =============== Graphique 3 : PACK =================

function createPack(root){

    // Creation du color scale pour le graphique ( à changer après)
    // ÉCHELLE DE COULEURS
    const level1Names = root.children ? root.children.map(d => d.data.name) : [];
    const colorScale = d3.scaleOrdinal()
        .domain(level1Names)
        .range(config.range_color);
    
    const container = d3.select("#pack_container");
    container.selectAll("*").remove();

    const pack = d3.pack()
        .size([config.width - 10, config.height - 10])
        .padding(3);

    pack(root);

    const svg = container.append("svg")
        .attr("width", config.width)
        .attr("height", config.height)
        .attr("viewBox", `0 0 ${config.width} ${config.height}`)
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