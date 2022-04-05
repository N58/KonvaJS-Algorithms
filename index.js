var width = window.innerWidth
var height = window.innerHeight - 100

var stage = new Konva.Stage({
    container: 'container',
    width: width,
    height: height,
})

let verticesLayer = new Konva.Layer()
let edgesLayer = new Konva.Layer()

stage.on('click', onStageClick)
stage.on('contextmenu', (e) => {
    e.evt.preventDefault();
});

stage.add(edgesLayer)
stage.add(verticesLayer)


let verticesCounter = 0

let vertices = []
let edges = []

const buttonRun = document.getElementById('run-button')
buttonRun.addEventListener('click', function(e) {
    const algorithm = document.getElementById('algorithms').value
    route = []
    clearEdges()
    generateDistanceMatrix()
    
    switch (algorithm) {
        case 'closest':
            closestVerticeAlgorithm()
            break;
        case 'farthest':
            farthestInsertion()
            break;
        default:
            break;
    }
})

const buttonClear = document.getElementById('clear')
buttonClear.addEventListener('click', function(e) {
    clearEdges()
    clearVertices()
})

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
}

window.onload = function() {
    const margin = 20
    for (let i = 0; i < 100; i++) {
        addVertice({x: getRandomInt(margin, width - margin), y: getRandomInt(margin, height - margin)})
    }
};

function addVertice(position) {
    let vertice = new Vertice(position)
    vertices.push(vertice)
    verticesCounter++
}

function onStageClick(e) {
    const isEmptySpace = e.target === e.target.getStage()

    if(isEmptySpace) {
        if(e.evt.button === 0) {
            let position = stage.getPointerPosition()
            addVertice(position)
        }
        else if(e.evt.button === 2) {
            clearEdges()
        }
    }
}

function clearVertices() {
    for (const vertice of vertices) {
        vertice.destroy()
    }
    vertices = []
    verticesCounter = 0
}

function clearEdges() {
    for (const edge of edges) {
        edge.destroy()
    }
    edges = []
}

function getClosest(vertice, array, splice = true) {
    let index
    for (let i = 0; i < array.length; i++) {
        const tempVertice = array[i];
        if(areVerticesEqual(vertice, tempVertice))
            continue
        
        if(!index)
            index = i

        const currentDistance = distanceMatrix[vertice.id][tempVertice.id]
        const bestDistance = distanceMatrix[vertice.id][array[index].id]

        if(currentDistance <= bestDistance) 
            index = i
    }

    let closest
    if(splice)
        closest = array.splice(index, 1)[0]
    else
        closest = array[index]

    return closest
}

let calcCount = 0
function getDistance(verA, verB) {
    calcCount++
    return Math.sqrt(Math.pow(verA.x - verB.x, 2) + Math.pow(verA.y - verB.y, 2))
}

function areVerticesEqual(verA, verB) {
    return (verA.x == verB.x && verA.y == verB.y) ? true : false
}

let distanceMatrix = []

function generateDistanceMatrix() {
    distanceMatrix = []
    for (let i = 0; i < vertices.length; i++) {
        distanceMatrix[i] = []
        for (let j = 0; j < vertices.length; j++) {
            const verA = vertices.find(v => v.id === i)
            const verB = vertices.find(v => v.id === j)
            if(areVerticesEqual(verA, verB))
                distanceMatrix[i][j] = 0
            else
                distanceMatrix[i][j] = getDistance(verA, verB)
        }
    }
}

let route = []

async function closestVerticeAlgorithm() {
    let tempArray = [...vertices]
    let current = tempArray.splice(0, 1)[0]
    route.push(current)

    while(tempArray.length > 0) {
        const closest = getClosest(current, tempArray)
        route.push(closest)
        await displayEdges(50)
        current = closest
    }

    //await displayEdges(0)
    writeStats()
}

async function farthestInsertion() {
    let tempArray = [...vertices]
    const count = tempArray.length - 1
    route = tempArray.splice(0, 1)

    while (tempArray.length > 0) {
        // Finding vertice farthest from current path
        let farthestIndex = 0
        let farthestInPathIndex = 0
        for (let i = 0; i < tempArray.length; i++) {
            const currentNew = tempArray[i]
            const closestInPath = getClosest(currentNew, route, false)

            const farthest = tempArray[farthestIndex]
            const farthestInPath = route[farthestInPathIndex]

            const currentDistance = distanceMatrix[currentNew.id][closestInPath.id]
            const bestDistance = distanceMatrix[farthest.id][farthestInPath.id]
            if(currentDistance > bestDistance) {
                farthestIndex = i
                farthestInPathIndex = route.findIndex(x => areVerticesEqual(x, closestInPath))
            }
        }

        const farthestObj = tempArray.splice(farthestIndex, 1)[0]
        if(route.length < 2) {
            route.push(farthestObj)
        }
        else {
            let bestIndex = 1
            let bestDistance = Infinity
            for (let i = 0; i < route.length; i++) {
                const first = route[i];
                let secondIndex

                if(i+1 >= route.length)
                    secondIndex = 0
                else 
                    secondIndex = i+1

                second = route[secondIndex]

                const distance = distanceMatrix[first.id][farthestObj.id] + distanceMatrix[farthestObj.id][second.id] - distanceMatrix[first.id][second.id]
                if(distance <= bestDistance) {
                    bestIndex = secondIndex
                    bestDistance = distance
                }
            }
            route.splice(bestIndex, 0, farthestObj)
        }

        await displayEdges(500)
    }

    //await displayEdges(0)
    writeStats()
}

async function displayEdges(time) {
    if(route.length >= 2) {
        clearEdges()
        for (let i = 0; i < route.length; i++) {
            if(i+1 >= route.length)
                edges.push(new Edge(route[i], route[0]))
            else
                edges.push(new Edge(route[i], route[i+1]))
        }
        await sleep(time)
    }
}

function writeStats() {
    console.log(`Vertices count: ${vertices.length}, Distance length: ${calculateOverallDistance()}, Distance calculation count: ${calcCount}`)
    calcCount = 0
}

function calculateOverallDistance() {
    let sum = 0
    for (let i = 0; i < edges.length; i++) {
        const edge = edges[i]
        sum += getDistance(edge.verA, edge.verB)
    }
    return Math.round(sum * 10) / 10
}

function sleep(ms) {
    return new Promise(
      resolve => setTimeout(resolve, ms)
    );
}

function deleteEdge(vertice) {
    edges = edges.filter((e) => {
        if((e.verA.id === vertice.id) || (e.verB.id === vertice.id)) {
            e.destroy()
            return false
        }
        else 
            return true
    })
}

function deleteVertice(vertice) {
    vertices = vertices.filter((v) => {
        if(v.id === vertice.id) {
            v.destroy()
            return false
        }
        else
            return true
    })
}

class Vertice {
    constructor(position) {
        this.rect = this.createRect()

        this.id = verticesCounter
        this.x = position.x - this.rect.width() / 2
        this.y = position.y - this.rect.height() / 2
    }

    set x(value) {
        this.X = value ? value : 0
        this.rect.x(this.X)
        deleteEdge(this)
    }

    get x() {
        return this.X
    }

    set y(value) {
        this.Y = value ? value : 0
        this.rect.y(this.Y)
        deleteEdge(this)
    }

    get y() {
        return this.Y
    }

    createRect() {
        let width = 10
        let height = 10
        let color = (vertices.length >= 1) ? 'red' : 'orange'

        let rect = new Konva.Rect({
            width: width,
            height: height,
            fill: 'white',
            stroke: color,
            strokeWidth: 2,
            draggable: true
        });
        verticesLayer.add(rect)
    
        rect.on('mouseover', function(e) {
            this.fill(color)
        })
    
        rect.on('mouseout', function(e) {
            this.fill('white')
        })

        rect.on('click', (e) => {
            deleteEdge(this)
            deleteVertice(this)
        })

        rect.on('dragmove', (e) => {
            this.x = rect.x()
            this.y = rect.y()
        })
    
        return rect
    }

    destroy() {
        this.rect.destroy()
    }
}

class Edge {
    constructor(verA, verB) {
        this.verA = verA
        this.verB = verB

        this.line = this.createLine()
        this.line.points([verA.x + 5, verA.y + 5, verB.x + 5, verB.y + 5])
    }

    createLine() {
        let line = new Konva.Line({
            name: `test${edges.length}`,
            stroke: 'black',
            strokeWidth: 2,
            lineCap: 'round',
            lineJoin: 'round',
        });
        edgesLayer.add(line)

        return line
    }

    destroy() {
        this.line.destroy()
    }
}