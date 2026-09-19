const KEY = "focuslist-v3";

const defaults = {
  tasks: [],
  sessions: [],
  target: 3,
  theme: "light"
};

export function loadState(){

  try{

    const raw = localStorage.getItem(KEY);

    if(!raw){
      return structuredClone(defaults);
    }

    const parsed = JSON.parse(raw);

    return {
      ...structuredClone(defaults),
      ...parsed,
      tasks:Array.isArray(parsed.tasks) ? parsed.tasks : [],
      sessions:Array.isArray(parsed.sessions)
        ? parsed.sessions
        : []
    };

  }catch{

    return structuredClone(defaults);

  }

}

export function saveState(state){

  localStorage.setItem(
    KEY,
    JSON.stringify(state)
  );

}