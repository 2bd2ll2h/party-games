import "./Rooms.css";

function Rooms({ player, onCreateRoom, onJoinRoom, onBack }) {
  return (
    <div className="rooms-page">
      {/* معلومات اللاعب */}
      <div className="player-info">
        <span className="player-avatar">{player.avatar}</span>
        <span className="player-name">{player.name}</span>
      </div>

      {/* زراير التحكم */}
      <div className="rooms-center">
        <button className="create-btn" onClick={onCreateRoom}>
          Create Room
        </button>
        <button className="join-btn" onClick={onJoinRoom}>
          Join Room
        </button>
      </div>

      {/* زرار الرجوع */}
      <button className="back-btn-mini" onClick={onBack}>← Back</button>
    </div>
  );
}

export default Rooms;