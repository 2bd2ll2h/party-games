import "./Rooms.css";

function Rooms({ player, onCreateRoom, onJoinRoom }) {
  return (
    <div className="rooms-page">
      {/* Player Info */}
      <div className="player-info">
        <span className="player-avatar">{player.avatar}</span>
        <span className="player-name">{player.name}</span>
      </div>

      {/* Center buttons */}
      <div className="rooms-center">
        <button className="create-btn" onClick={onCreateRoom}>
          Create Room
        </button>
        <button className="join-btn" onClick={onJoinRoom}>
          Join Room
        </button>
      </div>
    </div>
  );
}

export default Rooms;