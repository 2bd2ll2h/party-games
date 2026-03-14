import "./Rooms.css";

function Rooms({ player, onCreateRoom, onJoinRoom, onBack }) {
  return (
    <div className="rooms-page">
      {/* زرار الباك كبير وواضح فوق شمال */}
      <button className="back-btn-large-top" onClick={onBack}>
        ← Back
      </button>

      <div className="player-info">
        <span className="player-avatar">{player.avatar}</span>
        <span className="player-name">{player.name}</span>
      </div>

      <div className="rooms-center">
        <button className="create-btn" onClick={onCreateRoom}> Create Room </button>
        <button className="join-btn" onClick={onJoinRoom}> Join Room </button>
      </div>
    </div>





















  );
}

export default Rooms;