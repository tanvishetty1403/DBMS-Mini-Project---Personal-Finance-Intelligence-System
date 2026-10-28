export default function Flash({ msg }) {
  return msg ? <div className={'flash ' + msg.t}>{msg.m}</div> : null;
}
