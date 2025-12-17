// ==========================================
// MODERN DIRECTORY VISUALIZATION
// D3.js v7 - 5 Interactive Visualizations
// ==========================================

// Configuration
const config = {
    width: 960,
    height: 600,
    dataUrl: './data/directory.json',
    colorScheme: d3.schemeTableau10,
    transitionDuration: 750
};

// Global state
let globalRoot = null;
let treeOrientation = 'horizontal'; // or 'vertical'

// Shared tooltip
let tooltip = null;

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

// Initialize shared tooltip
function initTooltip() {
    if (!tooltip) {
        tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("position", "absolute")
            .style("display", "none");
    }
    return tooltip;
}

// Show tooltip
function showTooltip(event, d) {
    initTooltip();
    tooltip.style("display", "block")
        .html(`
            <strong>Nom:</strong> ${d.data.name}<br>
            <strong>Type:</strong> ${d.data.type || 'Dossier'}<br>
            <strong>Profondeur:</strong> ${d.depth}
            ${d.value ? `<br><strong>Fichiers:</strong> ${d.value}` : ''}
        `);
}

// Move tooltip
function moveTooltip(event) {
    if (tooltip) {
        tooltip.style("left", (event.pageX + 15) + "px")
            .style("top", (event.pageY - 15) + "px");
    }
}

// Hide tooltip
function hideTooltip() {
    if (tooltip) {
        tooltip.style("display", "none");
    }
}

// Get color for node based on root ancestor
function getNodeColor(d, colorScale) {
    if (d.depth === 0) return "rgba(190, 9, 9, 0.1)";

    let ancestor = d;
    while (ancestor.depth > 1) ancestor = ancestor.parent;

    const baseColor = colorScale(ancestor.data.name);
    return d.children ? d3.rgb(baseColor).brighter(0.8) : baseColor;
}

// Calculate statistics
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

// Display statistics
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

// ==========================================
// LOAD DATA & INITIALIZE
// ==========================================

d3.json(config.dataUrl).then(data => {
    globalRoot = d3.hierarchy(data)
        .sum(d => d.type === 'file' ? 1 : 0)
        .sort((a, b) => b.value - a.value);

    // Display statistics
    displayStats(globalRoot);

    // Create all visualizations
    createTreemap(globalRoot.copy());
    createTree(globalRoot.copy());
    createPack(globalRoot.copy());
    createSunburst(globalRoot.copy());
    createIcicle(globalRoot.copy());

}).catch(error => {
    console.error("Erreur lors du chargement des données JSON:", error);
    alert("Impossible de charger les données. Vérifiez que le fichier directory.json existe.");
});

// ==========================================
// VISUALIZATION 1: TREEMAP
// ==========================================

function createTreemap(root) {
    const container = d3.select("#treemap_container");
    container.selectAll("*").remove(); // Clear previous

    const treemap = d3.treemap()
        .size([config.width, config.height])
        .paddingOuter(6)
        .paddingInner(2)
        .round(true);

    treemap(root);

    // Color scale
    const level1Names = root.children ? root.children.map(d => d.data.name) : [];
    const colorScale = d3.scaleOrdinal()
        .domain(level1Names)
        .range(config.colorScheme);

    const svg = container.append("svg")
        .attr("width", config.width)
        .attr("height", config.height)
        .attr("viewBox", `0 0 ${config.width} ${config.height}`)
        .style("max-width", "100%")
        .style("height", "auto");

    const cell = svg.selectAll("g")
        .data(root.descendants().filter(d => d.depth > 0))
        .join("g")
        .attr("transform", d => `translate(${d.x0},${d.y0})`)
        .style("opacity", 0)
        .on("mouseover", function (event, d) {
            showTooltip(event, d);
            d3.select(this).select("rect")
                .style("stroke", "#fff")
                .style("stroke-width", 3);
        })
        .on("mousemove", moveTooltip)
        .on("mouseout", function (event, d) {
            hideTooltip();
            d3.select(this).select("rect")
                .style("stroke", d.children ? "#555" : "none")
                .style("stroke-width", 1);
        });

    // Animate entrance
    cell.transition()
        .duration(config.transitionDuration)
        .delay((d, i) => i * 5)
        .style("opacity", 1);

    // Rectangles
    cell.append("rect")
        .attr("class", "tile")
        .attr("width", d => Math.max(0, d.x1 - d.x0))
        .attr("height", d => Math.max(0, d.y1 - d.y0))
        .attr("fill", d => getNodeColor(d, colorScale))
        .attr("stroke", d => d.children ? "#555" : "none")
        .attr("rx", 4);

    // Text labels
    cell.append("text")
        .attr("x", 4)
        .attr("y", 16)
        .style("pointer-events", "none")
        .style("fill", d => d.children ? "#fff" : "#fff")
        .style("font-size", "11px")
        .style("font-weight", "600")
        .text(d => {
            const w = d.x1 - d.x0;
            const h = d.y1 - d.y0;
            return (w > 60 && h > 25) ? d.data.name : '';
        });
}

function resetTreemap() {
    if (globalRoot) createTreemap(globalRoot.copy());
}

// ==========================================
// VISUALIZATION 2: TREE (Dendrogram)
// ==========================================

function createTree(root) {
    const container = d3.select("#tree_container");
    container.selectAll("*").remove();

    const width = config.width;
    const height = config.height;

    const treeLayout = d3.tree()
        .size([height - 40, width - 160]);

    treeLayout(root);

    const svg = container.append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", `0 0 ${width} ${height}`)
        .style("max-width", "100%")
        .style("height", "auto");

    const g = svg.append("g")
        .attr("transform", "translate(80, 20)");

    // Color scale
    const level1Names = root.children ? root.children.map(d => d.data.name) : [];
    const colorScale = d3.scaleOrdinal()
        .domain(level1Names)
        .range(config.colorScheme);

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

    // Nodes
    const nodes = g.selectAll(".node")
        .data(root.descendants())
        .join("g")
        .attr("class", "node")
        .attr("transform", d => `translate(${d.y},${d.x})`)
        .style("opacity", 0)
        .on("mouseover", showTooltip)
        .on("mousemove", moveTooltip)
        .on("mouseout", hideTooltip);

    nodes.transition()
        .duration(config.transitionDuration)
        .delay((d, i) => i * 10)
        .style("opacity", 1);

    nodes.append("circle")
        .attr("r", d => d.children ? 6 : 4)
        .attr("fill", d => getNodeColor(d, colorScale))
        .attr("stroke", "#fff")
        .attr("stroke-width", 2);

    nodes.append("text")
        .attr("dy", "0.31em")
        .attr("x", d => d.children ? -10 : 10)
        .attr("text-anchor", d => d.children ? "end" : "start")
        .style("font-size", "10px")
        .style("fill", "#fff")
        .text(d => d.data.name);
}

function resetTree() {
    if (globalRoot) createTree(globalRoot.copy());
}

function toggleTreeOrientation() {
    // For future enhancement: toggle between horizontal and vertical
    alert("Fonctionnalité à venir: Toggle orientation");
}

// ==========================================
// VISUALIZATION 3: PACK (Circle Packing)
// ==========================================

function createPack(root) {
    const container = d3.select("#pack_container");
    container.selectAll("*").remove();

    const pack = d3.pack()
        .size([config.width - 20, config.height - 20])
        .padding(3);

    pack(root);

    const svg = container.append("svg")
        .attr("width", config.width)
        .attr("height", config.height)
        .attr("viewBox", `0 0 ${config.width} ${config.height}`)
        .style("max-width", "100%")
        .style("height", "auto");

    const g = svg.append("g")
        .attr("transform", "translate(10, 10)");

    // Color scale
    const level1Names = root.children ? root.children.map(d => d.data.name) : [];
    const colorScale = d3.scaleOrdinal()
        .domain(level1Names)
        .range(config.colorScheme);

    // Create nodes
    const nodes = g.selectAll("g")
        .data(root.descendants())
        .join("g")
        .attr("transform", d => `translate(${d.x},${d.y})`)
        .style("opacity", 0)
        .on("mouseover", showTooltip)
        .on("mousemove", moveTooltip)
        .on("mouseout", hideTooltip);

    nodes.transition()
        .duration(config.transitionDuration)
        .delay((d, i) => i * 5)
        .style("opacity", 1);

    nodes.append("circle")
        .attr("r", d => d.r)
        .attr("fill", d => {
            if (d.depth === 0) return "none";
            return getNodeColor(d, colorScale);
        })
        .attr("stroke", d => d.children ? "#fff" : "none")
        .attr("stroke-width", d => d.children ? 2 : 0)
        .style("opacity", d => d.depth === 0 ? 0 : (d.children ? 0.6 : 0.8));

    // Labels for larger circles
    nodes.append("text")
        .attr("text-anchor", "middle")
        .attr("dy", "0.3em")
        .style("font-size", d => Math.min(d.r / 3, 14) + "px")
        .style("fill", "#fff")
        .style("pointer-events", "none")
        .style("font-weight", "600")
        .text(d => d.r > 30 ? d.data.name : '');
}

function resetPack() {
    if (globalRoot) createPack(globalRoot.copy());
}

// ==========================================
// VISUALIZATION 4: SUNBURST (Radial Partition)
// ==========================================

function createSunburst(root) {
    const container = d3.select("#sunburst_container");
    container.selectAll("*").remove();

    const radius = Math.min(config.width, config.height) / 2;

    const partition = d3.partition()
        .size([2 * Math.PI, radius]);

    partition(root);

    const svg = container.append("svg")
        .attr("width", config.width)
        .attr("height", config.height)
        .attr("viewBox", `0 0 ${config.width} ${config.height}`)
        .style("max-width", "100%")
        .style("height", "auto");

    const g = svg.append("g")
        .attr("transform", `translate(${config.width / 2},${config.height / 2})`);

    // Color scale
    const level1Names = root.children ? root.children.map(d => d.data.name) : [];
    const colorScale = d3.scaleOrdinal()
        .domain(level1Names)
        .range(config.colorScheme);

    // Arc generator
    const arc = d3.arc()
        .startAngle(d => d.x0)
        .endAngle(d => d.x1)
        .padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.005))
        .padRadius(radius / 2)
        .innerRadius(d => d.y0)
        .outerRadius(d => d.y1 - 1);

    // Create arcs
    const paths = g.selectAll("path")
        .data(root.descendants().filter(d => d.depth > 0))
        .join("path")
        .attr("class", "arc")
        .attr("d", arc)
        .attr("fill", d => getNodeColor(d, colorScale))
        .attr("stroke", "#222")
        .attr("stroke-width", 1)
        .style("opacity", 0)
        .on("mouseover", function (event, d) {
            showTooltip(event, d);
            d3.select(this).style("opacity", 1);
        })
        .on("mousemove", moveTooltip)
        .on("mouseout", function () {
            hideTooltip();
            d3.select(this).style("opacity", 0.9);
        });

    paths.transition()
        .duration(config.transitionDuration)
        .delay((d, i) => i * 3)
        .style("opacity", 0.9);

    // Center label
    g.append("circle")
        .attr("r", radius / 10)
        .attr("fill", "#4a90e2")
        .attr("stroke", "#fff")
        .attr("stroke-width", 3);

    g.append("text")
        .attr("text-anchor", "middle")
        .attr("dy", "0.35em")
        .style("font-size", "14px")
        .style("font-weight", "700")
        .style("fill", "#fff")
        .text(root.data.name);
}

function resetSunburst() {
    if (globalRoot) createSunburst(globalRoot.copy());
}

// ==========================================
// VISUALIZATION 5: ICICLE (Vertical Partition)
// ==========================================

function createIcicle(root) {
    const container = d3.select("#icicle_container");
    container.selectAll("*").remove();

    const partition = d3.partition()
        .size([config.width, config.height])
        .padding(1);

    partition(root);

    const svg = container.append("svg")
        .attr("width", config.width)
        .attr("height", config.height)
        .attr("viewBox", `0 0 ${config.width} ${config.height}`)
        .style("max-width", "100%")
        .style("height", "auto");

    // Color scale
    const level1Names = root.children ? root.children.map(d => d.data.name) : [];
    const colorScale = d3.scaleOrdinal()
        .domain(level1Names)
        .range(config.colorScheme);

    // Create cells
    const cells = svg.selectAll("g")
        .data(root.descendants().filter(d => d.depth > 0))
        .join("g")
        .attr("transform", d => `translate(${d.x0},${d.y0})`)
        .style("opacity", 0)
        .on("mouseover", function (event, d) {
            showTooltip(event, d);
            d3.select(this).select("rect")
                .style("stroke", "#fff")
                .style("stroke-width", 3);
        })
        .on("mousemove", moveTooltip)
        .on("mouseout", function (event, d) {
            hideTooltip();
            d3.select(this).select("rect")
                .style("stroke", "#555")
                .style("stroke-width", 1);
        });

    cells.transition()
        .duration(config.transitionDuration)
        .delay((d, i) => i * 3)
        .style("opacity", 1);

    cells.append("rect")
        .attr("width", d => d.x1 - d.x0)
        .attr("height", d => d.y1 - d.y0)
        .attr("fill", d => getNodeColor(d, colorScale))
        .attr("stroke", "#555")
        .attr("stroke-width", 1)
        .attr("rx", 2);

    cells.append("text")
        .attr("x", 4)
        .attr("y", 16)
        .style("font-size", "10px")
        .style("fill", "#fff")
        .style("font-weight", "600")
        .style("pointer-events", "none")
        .text(d => {
            const w = d.x1 - d.x0;
            const h = d.y1 - d.y0;
            return (w > 60 && h > 20) ? d.data.name : '';
        });
}

function resetIcicle() {
    if (globalRoot) createIcicle(globalRoot.copy());
}
