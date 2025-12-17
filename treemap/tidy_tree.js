const dx = 35;
const dy = 200;
let infoTimeout;

const dataUrl = '../data/directory.json'; 
d3.json(dataUrl).then(data => {
    initializeTree(data);

    function initializeTree(data) {
        //! =========== Make Tree ===========
        const root = d3.hierarchy(data);

        const tree = d3.tree().nodeSize([dx, dy]);
        root.sort((a, b) => d3.ascending(a.data.name, b.data.name));

        //! =========== D3 layout ===========
        const container = d3.select("#tree_container")
            .style("position", "relative")
            .style("width", "100%")
            .style("font-family", "Arial, sans-serif");
        
        // ---------------------------------------- //
        const svg = container.append("svg")
            .style("height", "auto")
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
            const links = root.links();
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

            const link = linkGroup.selectAll("path").data(links, d => d.target.id);
            const linkEnter = link.enter().append("path")
                .attr("class", "link")
                .attr("fill", "none")
                .attr("stroke", "#666")
                .attr("stroke-opacity", 0.6)
                .attr("stroke-width", 2)
                .attr("d", d3.linkHorizontal()
                    .x(d => source.y0 || source.y)
                    .y(d => source.x0 || source.x)
                );
            
            link.merge(linkEnter).transition().duration(duration).attr("d", d3.linkHorizontal().x(d => d.y).y(d => d.x));
            link.exit().transition().duration(duration).attr("d", d3.linkHorizontal().x(d => source.y).y(d => source.x)).remove();

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
})