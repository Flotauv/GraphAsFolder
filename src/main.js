// dimensions
const width = 1600;
const height = 600;

const config = {
    width: 900,
    height: 600,
    dataUrl: './data/directory.json',
    colorScheme: d3.schemeTableau10,
    transitionDuration: 750,
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

        const dx = 35;
        const dy = 200;
        let infoTimeout;

        //! =========== Make Tree ===========
        

        const tree = d3.tree().nodeSize([dx, dy]);
        root.sort((a, b) => d3.ascending(a.data.name, b.data.name));

        // Assigner les IDs au départ pour les descendants (fichiers)
        root.descendants().forEach((d, i) => {
            d.id = i;
        });

        const diagonal = d3.linkHorizontal()
            .x(d => d.y)
            .y(d => d.x);

        //! =========== D3 layout ===========
        const container = d3.select("#tree_container")
            .style("position", "relative")
            .style("width", "100%")
            .style("font-family", "Arial, sans-serif");
        
        
        
        // ---------------------------------------- //
        const svg = container.append("svg")
            .style("height", height)
            .style("widht", width)
            .style("max-width", "100%")
            .style("display", "block")
            .style("margin", "0 auto")
            .style("transition", "margin-right 0.5s ease-in-out");

        // ---------------------------------------- //
        const infoPanelWidth = 400;
        const width_string = (infoPanelWidth - 20) + "px";

        const infoPanel = container.append("div")
            .style("class", "info-panel")
            .style("position", "fixed")
            .style("top", "130px")
            .style("right", "20px")
            .style("width", width_string)
            .style("max-height", "calc(100vh - 40px")
            .style("background", "rgba(255, 255, 255, 0.98)")
            .style("border", "1px solid #ccc")
            .style("border-radius", "8px")
            .style("padding", "15px")
            .style("box-shadow", "0 6px 12px rgba(0, 0, 0, 0.15)")
            .style("font-size", "14px")
            .style("opacity", "0")
            .style("pointer-events", "none")
            .style("transition", "opacity 0.3s ease")
            .style("overflow-y", "auto");
        
        // ---------------------------------------- //
        const defs = svg.append("defs");
        const gradient = defs.append("linearGradient")
            .attr("id", "nodeGradient")
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "100%")
            .attr("y2", "100%");
        gradient.append("stop").attr("offset", "0%").attr("stop-color", "#4CAF50");
        gradient.append("stop").attr("offset", "100%").attr("stop-color", "#2196F3");

        // ---------------------------------------- //
        const g = svg.append("g");
        const linkGroup = g.append("g").attr("class", "links");
        const nodeGroup = g.append("g").attr("class", "nodes");

        //! =========== Interactions ===========
        // ---------------------------------------- //
        function hideNodeInfo() {
            infoPanel.style("opacity", "0").style("pointer-events", "none");
            svg.style("margin-right", "0px");
        }

        // ---------------------------------------- //
        function showNodeInfo(event, d) {
            clearTimeout(infoTimeout);
            const nodeData = d.data;

            let infoHTML = `
                <h3 style="margin: 0 0 10px; color: #333; border-bottom: 2px solid #4CAF50; padding-bottom: 5px;">
                    Node Information
                </h3>

                <div style="margin-bottom: 15px;">
                    <div style="margin-bottom: 1px;"><strong> Name:</strong> ${nodeData.name || "N/A"} </div>
                    <div style="margin-bottom: 5px;"><strong> Type:</strong> ${nodeData.type || "N/A"} </div>

                    <div style="margin-bottom: 1px;"><strong> Depth:</strong> ${d.depth} </div>
                    <div style="margin-bottom: 1px;"><strong> Immediate Children:</strong> ${d.children ? d.children.length : 0} </div>
                </div>
            `;

            // ---------------------------------------- //
            infoPanel.html(infoHTML);
            infoPanel.select('.close-btn').on('click', hideNodeInfo);

            svg.style("margin-right", `${infoPanelWidth}px`);
            infoPanel
                .style("opacity", "1")
                .style("pointer-events", "auto");
            infoPanel
                .on("mouseenter", () => clearTimeout(infoTimeout))
                .on("mouseleave", () => {
                    infoTimeout = setTimeout(hideNodeInfo, 500);
                });
        }

        // ---------------------------------------- //
        function update(source) {
            const duration = 750;
            const nodes = root.descendants();
            // const links = root.links();
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
                .style("fill", "none")
                .style("stroke", "#888")
                .style("stroke-width", 2)
                .style("opacity", 0);

            links.transition()
                .duration(config.transitionDuration)
                .style("opacity", 0.4);

        

            const node = nodeGroup.selectAll("g.node").data(nodes, d => d.id || (d.id = ++i));
            const nodeEnter = node.enter().append("g")
                .attr("class", "node")
                .attr("transform", d => `translate(${source.y0 || source.y}, ${source.x0 || source.x})`)
                .style("cursor", "pointer")
                .on("mouseenter", (event, d) => {
                    showNodeInfo(event, d);
                    d3.select(event.currentTarget).select("circle").attr("stroke", "#ff6b6b").attr("stroke-width", 3);
                })
                .on("mouseleave", (event, d) => {
                    infoTimeout = setTimeout(hideNodeInfo, 1000);
                    d3.select(event.currentTarget).select("circle").attr("stroke", null).attr("stroke-width", null);
                });
            
            nodeEnter.append("circle")
                .attr("r", 1e-6)
                .style("filter", "drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.3)");
            
            nodeEnter.append("text")
                .attr("dy", "0.35em")
                .style("fill", "#333")
                .style("font-weight", "bold")
                .style("font-size", "13px")
                .style("text-shadow", "0 0 5px white, 0 0 5px white")
                .style("opacity", 0);
            
            const nodeUpdate = node.merge(nodeEnter);

            nodeUpdate.transition()
                .duration(duration)
                .attr("transform", d => `translate(${d.y}, ${d.x})`);
            
            nodeUpdate.select("circle")
                .transition()
                .duration(duration)
                .attr("r", 6)
                .attr("fill", d => d.children ? "url(#nodeGradient)" : "#FFC107");

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
