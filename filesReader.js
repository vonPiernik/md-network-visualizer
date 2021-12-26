const fs = require('fs')

let fileNamesCache = null;
let fileContentsCache = [];

function getFilesDir() {
    return 'C:\\Users\\Norbert\\Documents\\Notes\\zettelkasten';
}

function getMdFileNames() {
    const dir = getFilesDir();
    const allFiles = fs.readdirSync(dir)
    let filteredFiles = [];

    allFiles.forEach((file, index) => {
        if (!file.includes('.md')) {
            return;
        }

        filteredFiles.push(file);
    });

    if(fileNamesCache) {
        return fileNamesCache;
    }

    fileNamesCache = filteredFiles;

    return filteredFiles;
}

function readFile(name) {
    const cachedContent = fileContentsCache.find(item => item.name === name);

    if(cachedContent) {
        return cachedContent.content;
    }

    const file = fs.readFileSync(getFilesDir() + "\\" + name, 'utf8');

    fileContentsCache.push({
        name: name,
        content: file
    });

    return file;
}

function getMdFileNameFromH1(name) {
    let fileContent = readFile(name)
    let h1MdMarker = "# ";
    let newLineRegex = /\r?\n/;
    let fileName;

    let stringParts = fileContent.split(h1MdMarker);
    stringParts.shift();
    fileContent = stringParts.join(h1MdMarker);

    stringParts = fileContent.split(newLineRegex);
    fileName = stringParts[0] ?? name;

    return fileName;
}

function getNameWithoutExtension(fileName) {
    return fileName.replace(/\.[^/.]+$/, "")
}

function getNodes() {
    const files = getMdFileNames()

    let nodes = [];

    files.forEach((file, index) => {
        nodes.push({
            id: index,
            fileNameWithExtension: file,
            fileNameWithoutExtension: getNameWithoutExtension(file),
            label: getMdFileNameFromH1(file)
        })
    });

    return nodes;
}

function getEdges(nodes) {
    let edges = [];
    let currentEdgeId = 1;

    nodes.forEach((node, index) => {
        const fileContent = readFile(node.fileNameWithExtension);
        const links = fileContent.match(/\d+(?=\]\])/g)

        if(!links) {
            return;
        }

        links.forEach((fileNameWithoutExtension, index) => {
            const relatedNode = nodes.find(node => node.fileNameWithoutExtension === fileNameWithoutExtension);

            if(!relatedNode) {
                return;
            }

            edges.push({
                id: currentEdgeId,
                from: node.id,
                to: relatedNode.id
            })

            currentEdgeId++;
        })
    })

    return edges;
}

function createGraph(nodes, edges) {
    // create an array with nodes
    const visNodes = new vis.DataSet(nodes);

    // create an array with edges
    const visEdges = new vis.DataSet(edges);

    // create a network
    const container = document.getElementById("network");
    const data = {
        nodes: visNodes,
        edges: visEdges,
    };
    const options = {
        physics: {
            enabled: true,
            barnesHut: {
                theta: 0.5,
                gravitationalConstant: -50000,
                centralGravity: 0.1,
                springLength: 95,
                springConstant: 0.02,
                damping: 0.09,
                avoidOverlap: 0
            },
        },
        nodes: {
            borderWidth: 0,
            color: {
                background: "#484848",
            },
            font: {
                color: "#eeeeee",
                size: 32
            },
            shape: "box",
            shapeProperties: {
                borderRadius: 0
            }
        }
    };

    const network = new vis.Network(container, data, options);
}

function init() {
    const nodes = getNodes();
    const edges = getEdges(nodes)

    createGraph(nodes, edges);
}

init();