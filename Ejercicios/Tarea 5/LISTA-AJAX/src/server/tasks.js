let tasks = [];

export function addTask(text){
  tasks.push({ id: Date.now().toString(), text, completed: false });
}

export function deleteTask(id){
  tasks = tasks.filter(task => task.id !== id);
}

export function toggleTask(id){
  tasks = tasks.map(task => {
    if(task.id === id){
      task.completed = !task.completed;
    }
    return task;
  });
}

export function clearCompleted(){
  tasks = tasks.filter(task => !task.completed);
}

export function filterTasks(status){
  if(status === "completed") return tasks.filter(task => task.completed);
  if(status === "pending") return tasks.filter(task => !task.completed);
  return tasks;
}

export { tasks };
