
function showNotification(message) {
  const notification = document.createElement('div');
  notification.id = 'game-notification';
  notification.innerText = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 3000);
}
