export const PRIORITY_RANK = {
  high:0,
  medium:1,
  low:2
};

export function matchesTask(
  task,
  {
    filter="all",
    search=""
  }={}
){

  if(
    filter==="active" &&
    task.completed
  ) return false;

  if(
    filter==="completed" &&
    !task.completed
  ) return false;

  if(
    filter==="high" &&
    task.priority!=="high"
  ) return false;

  if(search){

    const text =
      `${task.title} ${task.notes||""} ${task.project||""}`
      .toLowerCase();

    if(
      !text.includes(
        search.toLowerCase()
      )
    ){
      return false;
    }

  }

  return true;
}


export function sortTaskCollection(
  tasks,
  mode="smart"
){

  return [...tasks].sort((a,b)=>{

    if(mode==="priority"){
      return (
        PRIORITY_RANK[a.priority] -
        PRIORITY_RANK[b.priority]
      );
    }

    if(mode==="created"){
      return b.createdAt.localeCompare(
        a.createdAt
      );
    }

    if(mode==="due"){
      return (
        (a.dueAt||"9999")
        .localeCompare(
          b.dueAt||"9999"
        )
      );
    }

    if(a.completed!==b.completed){

      return (
        Number(a.completed) -
        Number(b.completed)
      );

    }

    if(a.dueAt!==b.dueAt){

      return (
        (a.dueAt||"9999")
        .localeCompare(
          b.dueAt||"9999"
        )
      );

    }

    return (
      PRIORITY_RANK[a.priority] -
      PRIORITY_RANK[b.priority]
    );

  });

}