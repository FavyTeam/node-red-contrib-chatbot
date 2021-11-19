
/*
  dumpPath
  Dump a path to system console
*/
const dumpPath = (path) => {
  console.log(`Path (${path.length})`);
  path.forEach(node => console.log(`- ${node.source}-${node.name}`));
}

const follow = (node, nodes) => {
  //console.log(`Searching node connected to ${node.source}->${node.name}`);
  // get all nodes for which source is the destination
  const nodesPointingTo = nodes.filter(nodePointing => nodePointing.source === node.name);
  //console.log('trovati ', nodesPointingTo.length)
  if (nodesPointingTo.length === 0) {
    return [[node]];
  }

  const result = [];
  nodesPointingTo.forEach(nodePointing => {
    //console.log('Nodo che parte da ', node.name, ':', nodePointing.source,'->',nodePointing.name)
    //console.log('Node che ', follow(nodePointing, nodes))
    const chains = follow(nodePointing, nodes);
    chains.forEach(chain => {
      //console.log('trovata sta catena')
      //dumpPath(chain)
      result.push([node, ...chain]);
    });
  });
  
  return result;
};

/*
  Check if a path includes a node
*/
const hasNode = (name, path) => {
  if (path == null) {
    return false;
  }
  return path.some(node => node.name === name || node.source === name);
};  
  

const getDistance = (name, path) => {
  if (path == null) {
    return null;
  }
  let result;
  path.forEach((node, idx) => {
    if (node.name === name || node.source === name) {
      result = idx;
    }
  });
  return result;
}



module.exports = (name, source, nodes, debug = false) => {
  
  // this is the easyest
  if (name === source) {
    return true;
  }
  
  if (debug) {
    console.log(`Testing connection: ${source}->${name}`);
  //console.log('Existing nodes: ');
  //nodes
  //  .filter(node => node.source != null)
  //  .forEach(node => console.log(`- ${node.source}-${node.name}`))
  //console.log('Searching paths starting from: ', name)
  }

  let foundPaths = [];

  // take all connection that starts from the desidered destination and take all paths that 
  // originate from there, guaranteed the graph will end, there's no circular path 
  nodes.forEach(node => {
    if (node.source === name) {
      paths = follow(node, nodes);
      if (paths != null) {  
        foundPaths = [...foundPaths, ...paths];              
      }
    }
  });

  if (debug) {
    foundPaths.forEach(path => {
      dumpPath(path)    
    });
  }

  // find if any of these paths has a distance not null with the source (means it includes it)
  // and for this reason is circular
  const isCircular = foundPaths.some(path => getDistance(source, path) != null);

  return isCircular;
};