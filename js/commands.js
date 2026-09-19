export function getCommands(actions){

  return [

    ["New task","N",actions.newTask],

    ["Focus mode","F",actions.focus],

    ["Insights","4",actions.insights],

    ["Show inbox","2",actions.inbox],

    ["Toggle theme","T",actions.theme],

    [
      "Clear completed",
      "",
      actions.clearCompleted
    ]

  ];

}