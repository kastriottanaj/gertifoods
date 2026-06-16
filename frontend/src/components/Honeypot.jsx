// Spam trap shared by the public lead/sample forms. The field is invisible to
// real visitors (positioned off-screen, hidden from assistive tech, and out of
// the tab order) but spam bots autofill it. A filled value tells the backend to
// silently drop the submission. The field name "website" looks tempting to bots.
const HIDDEN_STYLE = {
  position: 'absolute',
  left: '-9999px',
  width: '1px',
  height: '1px',
  overflow: 'hidden',
};

export default function Honeypot({ value, onChange }) {
  return (
    <div style={HIDDEN_STYLE} aria-hidden="true">
      <label>
        Website
        <input
          type="text"
          name="website"
          value={value}
          onChange={onChange}
          tabIndex={-1}
          autoComplete="off"
        />
      </label>
    </div>
  );
}
