import { useCallback, useEffect, useRef, useState } from 'react';
import { Activity, ArrowDownToLine, ArrowLeft, ArrowRight, Bookmark, BookOpen, Box, Check, ChevronDown, ChevronLeft, ChevronRight, ChevronsRight, CircleHelp, CircuitBoard, Command, Cpu, FileCode2, FolderOpen, GitBranch, GripVertical, Layers, Maximize2, PanelRightClose, PanelRightOpen, Pause, Play, Plus, RotateCcw, Search, Settings2, ShieldCheck, SlidersHorizontal, Terminal, Upload, Waves, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { captureSchema, downloadFile, formatHex, parseCapture, parseVcd, type Capture, type SelectedObject, type WaveData } from '@/lib/quantum/capture';
import { Empty, Hardware, Memory, Pipeline, Registers, Timeline, Waveform } from './panels';

type Tool = 'Execution'|'Waveforms'|'RTL'|'Performance'|'Verification'|'Cache';
type Log = {severity:'info'|'error';message:string;time:string};
type BackendStatus = 'idle'|'connecting'|'connected'|'reconnecting'|'unavailable';
type BackendControls = {run:()=>Promise<void>;pause:()=>Promise<void>;step:()=>Promise<void>;reset:()=>Promise<void>};

const tools: {name:Tool;icon:typeof Cpu}[] = [{name:'Execution',icon:Cpu},{name:'Waveforms',icon:Waves},{name:'RTL',icon:FileCode2},{name:'Performance',icon:Activity},{name:'Verification',icon:ShieldCheck},{name:'Cache',icon:CircuitBoard}];
const defaultSettings={workspace:'Pipeline investigation',inspector:true,lower:'Registers',tab:'Execution' as Tool,closed:[] as string[]};

function PanelTitle({icon:Icon,title,extra,onClose,onExpand,pinned,onPin}:{icon:typeof Cpu;title:string;extra?:React.ReactNode;onClose?:()=>void;onExpand?:()=>void;pinned?:boolean;onPin?:()=>void}) {
  return <div className="panel-title"><Icon size={14}/><span>{title}</span>{extra}<span className="push-right"/>{onPin&&<Button variant="tool" size="micro" title={pinned?'Unpin panel':'Pin panel'} aria-label={pinned?'Unpin panel':'Pin panel'} onClick={onPin}><Bookmark size={12} className={pinned?'text-primary':''}/></Button>}{onExpand&&<Button variant="tool" size="micro" title="Expand panel" aria-label="Expand panel" onClick={onExpand}><Maximize2 size={12}/></Button>}{onClose&&<Button variant="tool" size="micro" title="Close panel" aria-label={`Close ${title}`} onClick={onClose}><X size={12}/></Button>}</div>;
}

/** Brand mark from GitHub UI — three diagonal bars representing the processor pipeline */
function BrandMark() {
  return (
    <div className="brand-symbol" aria-hidden="true">
      <span/>
      <span/>
      <span/>
    </div>
  );
}

/** Connection status pill matching GitHub UI design tokens */
function StatusPill({ status, detail, sessionId }: { status: BackendStatus; detail: string; sessionId: string | null }) {
  const cls =
    status === 'connected' ? 'connected-pill' :
    status === 'reconnecting' ? 'connected-pill status-amber' :
    status === 'unavailable' ? 'connected-pill status-red' :
    'connected-pill status-gray';
  const label =
    status === 'connected' ? (sessionId ? `session ${sessionId.slice(0,8)}` : 'Live backend') :
    status === 'reconnecting' ? 'Reconnecting…' :
    status === 'unavailable' ? 'Backend unavailable' :
    'Connecting…';
  return (
    <span className={cls} title={detail}>
      <i/>
      <span>{label}</span>
    </span>
  );
}

export function Studio(){
 const [capture,setCapture]=useState<Capture|null>(null); const [wave,setWave]=useState<WaveData|null>(null); const [index,setIndex]=useState(0); const [selected,setSelected]=useState<SelectedObject|null>(null);
 const [settings,setSettings]=useState(defaultSettings);const [palette,setPalette]=useState(false);const [query,setQuery]=useState('');const [importDialog,setImportDialog]=useState(false);const [diagnostics,setDiagnostics]=useState(false);const [logs,setLogs]=useState<Log[]>([]);const [logFilter,setLogFilter]=useState('');const [logQuery,setLogQuery]=useState('');const [error,setError]=useState('');const [expanded,setExpanded]=useState<string|null>(null);const [pins,setPins]=useState<string[]>([]);const [bookmarks,setBookmarks]=useState<{cycle:number;note:string}[]>([]);const [note,setNote]=useState('');const [compare,setCompare]=useState('');const [waveTime,setWaveTime]=useState(0);const [waveSignal,setWaveSignal]=useState('');const [preferences,setPreferences]=useState(false);const [ready,setReady]=useState(false);

 // Backend integration state from event bus
 const [backendStatus,setBackendStatus]=useState<BackendStatus>('idle');
 const [backendDetail,setBackendDetail]=useState('');
 const [backendSessionId,setBackendSessionId]=useState<string|null>(null);
 const backendControlsRef=useRef<BackendControls|null>(null);

 const fileRef=useRef<HTMLInputElement>(null); const cycle=capture?.cycles[index]; const previous=capture?.cycles[index-1];
 const select=(o:SelectedObject)=>{setSelected(o);setSettings(s=>({...s,inspector:true}));};
 const addLog=(severity:Log['severity'],message:string)=>setLogs(l=>[...l.slice(-199),{severity,message,time:new Date().toISOString().slice(11,19)}]);
 useEffect(()=>{try{const saved=localStorage.getItem('quantum-workspace');if(saved){const data=JSON.parse(saved);setSettings({...defaultSettings,...data});}const savedMarks=localStorage.getItem('quantum-bookmarks');if(savedMarks)setBookmarks(JSON.parse(savedMarks));}catch{/* recover default workspace */}setReady(true);},[]);
 useEffect(()=>{if(ready)localStorage.setItem('quantum-workspace',JSON.stringify(settings));},[settings,ready]);

 // Backend event bus listeners
 useEffect(()=>{
   const handleLiveCapture = (e: Event) => {
     const ce = e as CustomEvent<Capture>;
     if (ce.detail) {
       setCapture(ce.detail);
       setIndex((prev) => Math.max(0, ce.detail.cycles.length - 1));
     }
   };
   const handleLiveWave = (e: Event) => {
     const ce = e as CustomEvent<WaveData>;
     if (ce.detail) setWave(ce.detail);
   };
   const handleBackendStatus = (e: Event) => {
     const ce = e as CustomEvent<{status:BackendStatus;detail:string;sessionId:string|null}>;
     if (ce.detail) {
       setBackendStatus(ce.detail.status);
       setBackendDetail(ce.detail.detail);
       setBackendSessionId(ce.detail.sessionId);
     }
   };
   const handleBackendControls = (e: Event) => {
     const ce = e as CustomEvent<BackendControls>;
     if (ce.detail) backendControlsRef.current = ce.detail;
   };
   window.addEventListener("quantumrisc:capture", handleLiveCapture);
   window.addEventListener("quantumrisc:wave", handleLiveWave);
   window.addEventListener("quantumrisc:backend-status", handleBackendStatus);
   window.addEventListener("quantumrisc:backend-controls", handleBackendControls);
   return () => {
     window.removeEventListener("quantumrisc:capture", handleLiveCapture);
     window.removeEventListener("quantumrisc:wave", handleLiveWave);
     window.removeEventListener("quantumrisc:backend-status", handleBackendStatus);
     window.removeEventListener("quantumrisc:backend-controls", handleBackendControls);
   };
 }, []);

 const jump=useCallback((delta:number)=>setIndex(i=>Math.max(0,Math.min((capture?.cycles.length??1)-1,i+delta))),[capture]);
 useEffect(()=>{const handler=(e:KeyboardEvent)=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();setPalette(v=>!v);return;}if(e.key==='Escape'){setPalette(false);setImportDialog(false);setPreferences(false);setExpanded(null);return;}if((e.target as HTMLElement).matches('input,textarea,select'))return;if(e.key==='ArrowRight'){e.preventDefault();jump(1);}if(e.key==='ArrowLeft'){e.preventDefault();jump(-1);}if(e.key.toLowerCase()==='b'&&cycle){setBookmarks(b=>[...b,{cycle:cycle.cycle,note:''}]);}};window.addEventListener('keydown',handler);return()=>window.removeEventListener('keydown',handler);},[jump,cycle]);

 async function importFile(file:File){setError('');try{if(file.size>25*1024*1024)throw new Error('This importer supports files up to 25 MB. Export a smaller capture or VCD range.');const text=await file.text();if(file.name.toLowerCase().endsWith('.vcd')){const data=parseVcd(text);setWave(data);setWaveTime(0);setSettings(s=>({...s,tab:'Waveforms'}));addLog('info',`Imported ${file.name}: ${data.signals.length} signals`);}else{const data=parseCapture(text);setCapture(data);setIndex(0);setSelected({kind:'cycle',name:String(data.cycles[0]?.cycle)});setBookmarks([]);setSettings(s=>({...s,tab:'Execution'}));addLog('info',`Imported ${data.name}: ${data.cycles.length} cycles`);}setImportDialog(false);}catch(e){const message=e instanceof Error?e.message:'Unable to read file';setError(message);addLog('error',message);setImportDialog(true);}if(fileRef.current)fileRef.current.value='';}

 const bookmark=()=>{if(!cycle)return;setBookmarks(b=>{const next=[...b.filter(x=>x.cycle!==cycle.cycle),{cycle:cycle.cycle,note}];setNote('');return next;});};
 const goEvent=(direction:number)=>{if(!capture)return;let target=index+direction;while(target>=0&&target<capture.cycles.length){if(capture.cycles[target]?.events?.length){setIndex(target);return;}target+=direction;}};
 const diffCycle=capture?.cycles.find(c=>String(c.cycle)===compare);
 const difference=(key:'registers'|'memory')=>Object.entries(cycle?.[key]??{}).filter(([name,value])=>diffCycle?.[key]?.[name]!==undefined&&diffCycle[key]?.[name]!==value);
 const closePanel=(id:string)=>{if(pins.includes(id))return;setSettings(s=>({...s,closed:[...s.closed,id]}));};
 const titleProps=(id:string)=>({onClose:()=>closePanel(id),onExpand:()=>setExpanded(expanded===id?null:id),pinned:pins.includes(id),onPin:()=>setPins(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id])});
 const importAction=<Button variant="outline" size="sm" onClick={()=>setImportDialog(true)}><Upload size={13}/> Import execution</Button>;
 const pipelinePanel=<section className="engineering-panel"><PanelTitle icon={GitBranch} title="Pipeline flow" extra={<span className="panel-badge mono">5 STAGES</span>} {...titleProps('pipeline')}/><Pipeline cycle={cycle} select={select}/></section>;
 const lowerPanel=<section className="engineering-panel fill-panel"><div className="panel-title"><Layers size={14}/>{['Registers','Memory','State diff','Dependencies'].map(t=><Button key={t} variant="tab" size="compact" className={settings.lower===t?'selected':''} onClick={()=>setSettings(s=>({...s,lower:t}))}>{t}</Button>)}<span className="push-right"/><Button variant="tool" size="micro" title="Move panel above pipeline" aria-label="Move panel above pipeline" onClick={()=>setSettings(s=>({...s,closed:s.closed.includes('reversed')?s.closed.filter(x=>x!=='reversed'):[...s.closed,'reversed']}))}><GripVertical size={12}/></Button><Button variant="tool" size="micro" title="Expand state panel" onClick={()=>setExpanded('state')}><Maximize2 size={12}/></Button></div>{settings.lower==='Registers'?<Registers cycle={cycle} previous={previous} select={select}/>:settings.lower==='Memory'?<Memory cycle={cycle} select={select}/>:settings.lower==='State diff'?<><div className="panel-tools"><span>Compare current cycle with</span><input className="cycle-input" placeholder="Cycle" aria-label="Compare cycle" value={compare} onChange={e=>setCompare(e.target.value)}/></div>{diffCycle?<div className="diff-list">{(['registers','memory'] as const).map(key=><div key={key}><h4>{key} <span>{difference(key).length} changed</span></h4>{difference(key).map(([name,value])=><Button variant="data" key={name} onClick={()=>select({kind:key==='registers'?'register':'memory',name,value:String(value)})}><span className="mono">{name}</span><span className="mono">{formatHex(diffCycle[key]?.[name])} → {formatHex(value)}</span></Button>)}</div>)}</div>:<Empty icon={Layers} title="Select a comparison cycle" detail="State differences require two captured cycles containing the same registers or memory addresses."/>}</>:<div className="dependency-content">{cycle?.events?.length?cycle.events.map((event,i)=><Button variant="data" key={i} onClick={()=>select({kind:'event',name:event.type,value:event.description,pc:event.pc})}><GitBranch size={16}/><span>{event.description}</span><ArrowRight size={14}/></Button>):<Empty icon={GitBranch} title="No dependency events" detail="Producer, consumer, and resolution relationships require captured dependency events."/>}</div>}</section>;

 const searchResults=capture?.cycles.flatMap((c,i)=>[
   {category:'Cycle',label:`Cycle ${c.cycle}`,index:i,object:{kind:'cycle' as const,name:String(c.cycle)}},
   ...Object.values(c.pipeline??{}).filter(v=>v!==null).map(v=>({category:'Instruction',label:`${v?.pc} ${v?.instruction}`,index:i,object:{kind:'instruction' as const,name:v?.instruction??'',pc:v?.pc}})),
   ...Object.entries(c.registers??{}).map(([name,value])=>({category:'Register',label:`${name} ${formatHex(value)}`,index:i,object:{kind:'register' as const,name,value:String(value)}})),
   ...(c.events??[]).map(e=>({category:'Event',label:e.description,index:i,object:{kind:'event' as const,name:e.type,value:e.description}}))
 ]).filter(r=>r.label.toLowerCase().includes(query.toLowerCase())).slice(0,35)??[];

 const backendConnected = backendStatus === 'connected';
 const runBackend = () => { backendControlsRef.current?.run().catch(()=>{}); };
 const pauseBackend = () => { backendControlsRef.current?.pause().catch(()=>{}); };
 const stepBackend = () => { backendControlsRef.current?.step().catch(()=>{}); };
 const resetBackend = () => { backendControlsRef.current?.reset().catch(()=>{}); };

 return <div className="studio"><input type="file" accept=".json,.vcd" ref={fileRef} hidden onChange={e=>{const file=e.target.files?.[0];if(file)void importFile(file);}}/>
 <header className="topbar">
   {/* Brand — new GitHub UI design with purple diagonal bars */}
   <div className="brand">
     <BrandMark/>
     <span>QUANTUM<span>RISC</span><b>STUDIO</b></span>
   </div>
   {/* Session / status area */}
   <div className="topbar-session">
     <span className="session-label-sm">SESSION</span>
     <span className="session-name-sm">{capture?.name ?? (backendSessionId ? backendSessionId.slice(0,12) : 'no active session')}</span>
   </div>
   {/* Execution controls */}
   <div className="execution-controls">
     <button type="button" className={`tool-button${backendConnected?'':' opacity-40'}`} disabled={!backendConnected} onClick={resetBackend} title="Reset simulation — send reset to backend"><RotateCcw size={13}/><span>Reset</span></button>
     <button type="button" className={`tool-button${backendConnected?'':' opacity-40'}`} disabled={!backendConnected} onClick={runBackend} title="Run simulation — send run to backend"><Play size={13}/><span>Run</span></button>
     <button type="button" className={`tool-button${backendConnected?'':' opacity-40'}`} disabled={!backendConnected} onClick={pauseBackend} title="Pause simulation — send pause to backend"><Pause size={13}/><span>Pause</span></button>
     <button type="button" className={`tool-button${backendConnected?'':' opacity-40'}`} disabled={!backendConnected} onClick={stepBackend} title="Step one cycle — send step to backend"><ChevronsRight size={13}/><span>Step</span></button>
   </div>
   {/* Cycle counter */}
   <div className="cycle-block">
     <span className="cycle-label">CYCLE</span>
     <strong>{cycle?.cycle ?? '—'}</strong>
     <div className="cycle-meta">
       <b>STATUS</b>{backendStatus.toUpperCase()}
     </div>
   </div>
   {/* Global search */}
   <button type="button" className="global-search" onClick={()=>{setQuery('');setPalette(true);}}>
     <Search size={13}/>
     <span>Search execution…</span>
     <kbd>⌘K</kbd>
   </button>
   {/* Top actions */}
   <div className="top-actions">
     <StatusPill status={backendStatus} detail={backendDetail} sessionId={backendSessionId}/>
     <button type="button" className="icon-button" title="Workspace settings" aria-label="Workspace settings" onClick={()=>setPreferences(true)}><Settings2 size={14}/></button>
     <button type="button" className="icon-button" title={settings.inspector?'Hide inspector':'Show inspector'} aria-label="Toggle inspector" onClick={()=>setSettings(s=>({...s,inspector:!s.inspector}))}>{settings.inspector?<PanelRightClose size={14}/>:<PanelRightOpen size={14}/>}</button>
   </div>
 </header>
 <div className="main-shell"><nav className="tool-rail" aria-label="Engineering tools">{tools.map(({name,icon:Icon})=><Button key={name} variant="rail" className={settings.tab===name?'selected':''} title={name} aria-label={name} onClick={()=>setSettings(s=>({...s,tab:name}))}><Icon size={19}/><span>{name==='Execution'?'Execute':name==='Waveforms'?'Waves':name==='Verification'?'Verify':name==='Performance'?'Analyze':name}</span></Button>)}<div className="rail-bottom"><Button variant="rail" title="Diagnostics" aria-label="Diagnostics" className={diagnostics?'selected':''} onClick={()=>setDiagnostics(!diagnostics)}><Terminal size={18}/><span>Console</span></Button><Button variant="rail" title="Import capture format" aria-label="Import capture" onClick={()=>setImportDialog(true)}><CircleHelp size={18}/><span>Format</span></Button></div></nav>
 <main className="work-area"><div className="workspace-heading"><div><span className="eyebrow">INVESTIGATION / {settings.tab.toUpperCase()}</span><h1>{settings.tab==='Execution'?'Processor execution':settings.tab==='Waveforms'?'Signal investigation':`${settings.tab} investigation`}</h1></div><div className="heading-actions"><span className="capture-mode mono">{capture?'READ-ONLY CAPTURE':'AWAITING EXECUTION DATA'}</span><Button variant="outline" size="sm" onClick={()=>{setSettings(s=>({...s,closed:[],inspector:true}));setPreferences(true);}}><Plus size={13}/> Add panel</Button></div></div>
 {!capture&&<div className="connection-banner"><span className="banner-symbol"><CircuitBoard size={17}/></span><div><strong>{backendStatus==='unavailable'?'Backend unavailable.':'Connecting to backend…'}</strong><span>{backendStatus==='unavailable'?'Start the QuantumRISC backend (uvicorn on port 8000) or import a local capture.':backendDetail||'Establishing session with the QuantumRISC processor backend.'}</span></div><Button variant="link" size="sm" onClick={()=>setImportDialog(true)}>Import capture <ArrowRight size={13}/></Button></div>}
 <div className="canvas"><ResizablePanelGroup orientation="horizontal"><ResizablePanel defaultSize={settings.inspector?'73%':'100%'} minSize="45%"><div className="canvas-main">{settings.tab==='Execution'?<>{!settings.closed.includes('pipeline')&&<div className={settings.closed.includes('reversed')?'order-second':''}>{pipelinePanel}</div>}{lowerPanel}</>:<section className="engineering-panel fill-panel"><PanelTitle icon={tools.find(t=>t.name===settings.tab)?.icon??Activity} title={settings.tab==='Waveforms'?'Waveform viewer':settings.tab} extra={<span className="panel-badge">{settings.tab==='Waveforms'?'VCD':'CAPTURE DATA'}</span>}/>{settings.tab==='Waveforms'?<Waveform wave={wave} selected={waveSignal} setSelected={s=>{setWaveSignal(s);select({kind:'signal',name:s});}} time={waveTime} setTime={setWaveTime}/>:<Hardware mode={settings.tab} capture={capture} cycle={cycle} select={select}/>}</section>}{!settings.closed.includes('trace')&&<section className="engineering-panel trace-panel"><PanelTitle icon={Activity} title="Universal trace" extra={<span className="panel-badge mono">{cycle?`CYCLE ${cycle.cycle}`:'TIME AXIS'}</span>} {...titleProps('trace')}/><Timeline capture={capture} index={index} setIndex={setIndex} select={select}/></section>}</div></ResizablePanel>{settings.inspector&&<><ResizableHandle/><ResizablePanel defaultSize="27%" minSize="21%" maxSize="40%"><aside className="object-inspector"><PanelTitle icon={SlidersHorizontal} title="Object inspector" extra={<span className="panel-badge">CONTEXT</span>}/><div className="inspector-tabs"><span className="selected">Inspect</span><span>Relationships</span><span className="push-right mono">{selected?.kind??'—'}</span></div>{selected?<div className="inspector-body"><span className="eyebrow">{selected.kind.toUpperCase()} OBJECT</span><h2 className="mono">{selected.name}</h2><div className="object-properties"><div><span>Cycle</span><strong className="mono">{cycle?.cycle??'Unavailable'}</strong></div>{selected.pc&&<div><span>Program counter</span><strong className="mono">{selected.pc}</strong></div>}<div><span>Value</span><strong className="mono">{selected.value??'Unavailable'}</strong></div>{selected.kind==='register'&&<><div><span>Hexadecimal</span><strong className="mono">{formatHex(selected.value)}</strong></div><div><span>Previous value</span><strong className="mono">{formatHex(previous?.registers?.[selected.name])}</strong></div></>}</div><div className="inspector-section-title">RELATED EVENTS <span>{cycle?.events?.length??0}</span></div>{cycle?.events?.length?cycle.events.filter(e=>!selected.pc||!e.pc||e.pc===selected.pc).map((e,i)=><Button variant="relationship" key={i} onClick={()=>select({kind:'event',name:e.type,value:e.description,pc:e.pc})}><GitBranch size={14}/><span><strong>{e.type}</strong><small>{e.description}</small>{e.resolution&&<small>Resolution: {e.resolution}</small>}</span><ChevronRight size={13}/></Button>):<p className="inspector-hint">No related events were included in this cycle.</p>}</div>:<div className="inspector-empty"><div className="inspector-crosshair"><Box size={25}/></div><h3>No object selected</h3><p>Select an instruction, register, signal, or captured cycle to inspect its state and relationships.</p><div className="object-types">{['Instruction','Register','Memory','Signal','Event'].map((t,i)=><div key={t}><span className="mono">0{i+1}</span>{t}<ChevronRight size={12}/></div>)}</div></div>}<div className="inspector-section-title">INVESTIGATION BOOKMARKS <span>{bookmarks.length}</span><Button variant="tool" size="micro" title="Bookmark selected cycle" aria-label="Bookmark cycle" disabled={!cycle} onClick={bookmark}><Plus size={12}/></Button></div>{bookmarks.length?<div className="bookmark-list">{bookmarks.map(b=><Button variant="data" key={b.cycle} onClick={()=>{const i=capture?.cycles.findIndex(c=>c.cycle===b.cycle);if(i!==undefined&&i>=0)setIndex(i);}}><Bookmark size={12}/><span>Cycle {b.cycle}<small>{b.note}</small></span></Button>)}</div>:<div className="bookmark-empty">No bookmarked execution points.</div>}{cycle&&<div className="annotation"><textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Personal investigation note…" aria-label="Investigation note"/><Button variant="outline" size="compact" onClick={bookmark}>Save note at cycle {cycle.cycle}</Button></div>}<div className="provenance"><BookOpen size={13}/><strong>Execution provenance</strong><dl><dt>Session</dt><dd>{capture?.name??'Not connected'}</dd><dt>Testbench</dt><dd>{capture?.testbench??'Unavailable'}</dd><dt>RTL version</dt><dd>{capture?.rtlVersion??'Unavailable'}</dd><dt>Source</dt><dd>{backendStatus==='connected'?'Live backend':'No capture'}</dd></dl></div></aside></ResizablePanel></>}</ResizablePanelGroup></div>
 <div className="execution-footer"><Button variant="tool" size="micro" disabled={!capture} title="Previous event" aria-label="Previous event" onClick={()=>goEvent(-1)}><ArrowLeft size={12}/></Button><span>Event navigation</span><Button variant="tool" size="micro" disabled={!capture} title="Next event" aria-label="Next event" onClick={()=>goEvent(1)}><ArrowRight size={12}/></Button><span className="toolbar-separator"/><span className="mono">{cycle?`Cycle ${cycle.cycle}`:'Cycle —'}</span><input type="range" aria-label="Execution timeline cursor" min="0" max={Math.max(0,(capture?.cycles.length??1)-1)} value={index} disabled={!capture} onChange={e=>setIndex(Number(e.target.value))}/><span className="mono">{capture?.cycles.at(-1)?.cycle??'—'}</span><Button variant="tool" size="micro" disabled={!cycle} onClick={bookmark} title="Bookmark current cycle"><Bookmark size={13}/></Button></div>
 </main></div><footer className="statusbar"><span><i className={`dot ${backendStatus==='connected'?'mint':capture?'mint':'amber'}`}/>{backendStatus==='connected'?'Live backend':capture?'Capture inspection':'Backend unavailable'}</span><span className="status-divider"/><span><Cpu size={12}/>{capture?.processor??'Processor unavailable'}</span><span className="status-divider"/><span>{capture?`${capture.cycles.length} cycles`:'No execution data'}</span><div className="push-right"/><Button variant="tool" size="compact" onClick={()=>setDiagnostics(!diagnostics)}><Terminal size={12}/>{logs.filter(l=>l.severity==='error').length} errors · Diagnostics</Button><span className="status-divider"/><span className="mono">QuantumRISC Studio</span></footer>
 {diagnostics&&<section className="diagnostics"><PanelTitle icon={Terminal} title="Diagnostic center" onClose={()=>setDiagnostics(false)}/><div className="panel-tools"><select aria-label="Diagnostic severity" value={logFilter} onChange={e=>setLogFilter(e.target.value)}><option value="">All severities</option><option value="info">Info</option><option value="error">Error</option></select><input aria-label="Search diagnostics" placeholder="Search diagnostics" value={logQuery} onChange={e=>setLogQuery(e.target.value)}/><Button variant="tool" size="sm" onClick={()=>void navigator.clipboard.writeText(logs.map(l=>`${l.time} ${l.severity} ${l.message}`).join('\n'))}>Copy</Button></div><div className="log-lines"><div className="log-line info"><span>—</span><b>STATUS</b><span>Backend: {backendStatus} · {backendDetail || 'No detail'}</span></div>{logs.filter(l=>(!logFilter||l.severity===logFilter)&&l.message.toLowerCase().includes(logQuery.toLowerCase())).map((l,i)=><div key={i} className={`log-line ${l.severity}`}><span>{l.time}</span><b>{l.severity.toUpperCase()}</b><span>{l.message}</span></div>)}</div></section>}
 {importDialog&&<div className="modal-backdrop" onClick={()=>setImportDialog(false)}><section role="dialog" aria-modal="true" aria-label="Import execution capture" className="import-modal" onClick={e=>e.stopPropagation()}><PanelTitle icon={Upload} title="Import execution capture" onClose={()=>setImportDialog(false)}/><div className="modal-body"><h2>Bring your execution into focus.</h2><p>Open a real execution JSON capture or a simulator-generated VCD file. Files stay in this browser.</p><div className="file-drop" onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();const f=e.dataTransfer.files[0];if(f)void importFile(f);}}><Upload size={25}/><strong>Drop an execution capture</strong><span>JSON or VCD · up to 25 MB</span><Button variant="default" size="sm" onClick={()=>fileRef.current?.click()}><FolderOpen size={14}/> Choose file</Button></div>{error&&<div role="alert" className="import-error">{error}</div>}<details className="format-help"><summary>Execution JSON format <ChevronDown size={13}/></summary><p>Use your actual measurements. Only name, cycles, and a unique cycle number are required. Optional state must represent that cycle, not deltas.</p><pre>{`{\n  "name": "your-session",\n  "cycles": [\n    {\n      "cycle": 0,\n      "pipeline": { "IF": null },\n      "registers": {},\n      "memory": {},\n      "events": []\n    }\n  ]\n}`}</pre><p>Optional fields: processor, testbench, rtlVersion, timestamp, performance, verification, rtl. Pipeline entries accept pc and instruction; events accept type and description. A standalone VCD is not mapped to execution cycles.</p><Button variant="outline" size="sm" onClick={()=>downloadFile('execution-capture.schema.json',JSON.stringify({description:'QuantumRISC execution capture format',required:['name','cycles'],cycleRequired:['cycle'],pipelineStages:['IF','ID','EX','MEM','WB'],instructionRequired:['pc','instruction'],eventRequired:['type','description'],maxCycles:100000},null,2))}>Export format reference</Button></details><div className="backend-note"><CircuitBoard size={15}/><span>Live simulation uses the QuantumRISC backend (port 8000). Current backend status: <strong>{backendStatus}</strong>.</span></div></div></section></div>}
 {palette&&<div className="modal-backdrop" onClick={()=>setPalette(false)}><section className="command-palette" role="dialog" aria-modal="true" aria-label="Engineering search" onClick={e=>e.stopPropagation()}><div className="palette-input"><Search size={19}/><input autoFocus aria-label="Search engineering objects and commands" placeholder="Find an object or run a command…" value={query} onChange={e=>setQuery(e.target.value)}/><kbd>ESC</kbd></div><div className="palette-results"><span className="eyebrow">COMMANDS</span>{[{label:'Import execution capture',action:()=>setImportDialog(true),icon:Upload},...tools.map(t=>({label:`Open ${t.name}`,action:()=>setSettings(s=>({...s,tab:t.name})),icon:t.icon})),{label:'Open diagnostics',action:()=>setDiagnostics(true),icon:Terminal},{label:'Reset workspace layout',action:()=>setSettings(defaultSettings),icon:RotateCcw}].filter(c=>c.label.toLowerCase().includes(query.toLowerCase())).map(c=><Button variant="command" key={c.label} onClick={()=>{c.action();setPalette(false);}}><c.icon size={15}/>{c.label}<ChevronsRight size={13}/></Button>)}{query&&<><span className="eyebrow">EXECUTION OBJECTS</span>{searchResults.length?searchResults.map((r,i)=><Button variant="command" key={i} onClick={()=>{setIndex(r.index);select(r.object);setPalette(false);}}><span className="result-category">{r.category}</span><span className="mono">{r.label}</span></Button>):<p className="search-empty">No matching captured objects.</p>}</>}</div><div className="palette-foot"><Command size={12}/> QuantumRISC engineering search <span className="push-right">{capture?'Capture objects indexed':'No capture loaded'}</span></div></section></div>}
 {preferences&&<div className="modal-backdrop" onClick={()=>setPreferences(false)}><section className="settings-modal" role="dialog" aria-modal="true" aria-label="Workspace configuration" onClick={e=>e.stopPropagation()}><PanelTitle icon={Settings2} title="Workspace configuration" onClose={()=>setPreferences(false)}/><div className="modal-body"><label className="settings-label">INVESTIGATION NAME<input value={settings.workspace} onChange={e=>setSettings(s=>({...s,workspace:e.target.value}))}/></label><div className="workspace-presets">{['Pipeline investigation','Waveform investigation','Performance investigation','Verification investigation'].map((name,i)=><Button variant="relationship" key={name} onClick={()=>{setSettings(s=>({...s,workspace:name,tab:(['Execution','Waveforms','Performance','Verification'] as const)[i] ?? s.tab}));setPreferences(false);}}><Layers size={16}/>{name}<ChevronRight size={14}/></Button>)}</div><Button variant="outline" size="sm" onClick={()=>{setSettings(defaultSettings);setPreferences(false);}}>Restore default panels</Button><div className="backend-note">Workspace layout is saved in this browser. Imported telemetry stays in memory; export an investigation before leaving.</div></div></section></div>}
 {expanded&&<div className="modal-backdrop expanded-backdrop"><section className="expanded-panel"><div className="expanded-header"><span>Expanded investigation panel</span><Button variant="tool" size="sm" onClick={()=>setExpanded(null)}><X size={14}/> Return to workspace</Button></div>{expanded==='pipeline'?pipelinePanel:expanded==='state'?lowerPanel:<Timeline capture={capture} index={index} setIndex={setIndex} select={select}/>}</section></div>}
 </div>;
}
