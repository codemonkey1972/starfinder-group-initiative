const sortArrayOfObjects = (arr, propertyName, order = 'ascending') => {
  const sortedArr = arr.sort((a, b) => {
    if (a[propertyName] < b[propertyName]) {
      return -1;
    }
    if (a[propertyName] > b[propertyName]) {
      return 1;
    }
    return 0;
  });

  if (order === 'descending') {
    return sortedArr.reverse();
  }

  return sortedArr;
};

const sortInitiative = function(turnorder) {
    return sortArrayOfObjects(turnorder, 'pr', 'descending');
}

on("chat:message", msg => {
    const userCommand = msg.content.split(" ")[0].toLowerCase();
    
    if(userCommand === '!group-init') {
        var turnorder;
        if(Campaign().get("turnorder") == "") turnorder = []; //NOTE: We check to make sure that the turnorder isn't just an empty string first. If it is treat it like an empty array.
        else turnorder = JSON.parse(Campaign().get("turnorder"));
        var m_obj = _.chain(msg.selected)  // Start a chain of the selected objects
            .map(function(s){
                return getObj('graphic',s._id);  // try to get each as a graphic (will be undefined for drawings, text, etc
            })
            .reject(_.isUndefined)  // Remove those selected objects that were not graphics (drawings, text, etc)                  
            .each(function(t){
                var character = getObj("character", t.get('represents'));
                var type = (character.get("controlledby") === "" || character.get("controlledby") === "all") ? 'Monster' : 'Player';
                var dex_bonus;
                var init_misc;
                if (type === 'Player') {
                    var dex = 10 + parseInt(getAttrByName(character.id, "DEX-race"))
                        + parseInt(getAttrByName(character.id, "DEX-theme"))
                        + parseInt(getAttrByName(character.id, "DEX-augment"))
                        + parseInt(getAttrByName(character.id, "DEX-point_buy"))
                        + parseInt(getAttrByName(character.id, "DEX-abil_incr"))
                        + parseInt(getAttrByName(character.id, "DEX-misc"))
                        + parseInt(getAttrByName(character.id, "DEX-temp"));
                    dex_bonus = Math.floor(dex/2) - 5
                    init_misc = getAttrByName(character.id, "init-misc")
                } else {
                    dex_bonus = getAttrByName(character.id, "DEX-bonus");
                    init_misc = getAttrByName(character.id, "npc-init-misc");
                }
                var dice_roll = Math.floor(Math.random() * (20 - 1) + 1);
                var init_mod = parseInt(dex_bonus) + parseInt(init_misc);
                var init_roll = dice_roll + init_mod;
                var initiative = init_roll + (init_mod/100);
                // TODO replace if existing ID, don't add to array
                turnorder.push({
                    'id': t.get('id'),
                    'pr': initiative,
                    custom: "Turn Counter",
                    "_pageid": Campaign().get("playerpageid")
                });
            })
        .value();
        turnorder = sortInitiative(turnorder);
        Campaign().set("turnorder", JSON.stringify(turnorder));
    }
})
