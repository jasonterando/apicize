// import "./styles.css";
// import { createContext, ReactNode, useCallback, useContext, useState } from "react"

// class FakeDatabaseClass {
//     public data = new Map([
//         ['A', { id: 'A', name: 'Item A', counter: 0 }],
//         ['B', { id: 'B', name: 'Item B', counter: 0 }],
//         ['C', { id: 'C', name: 'Item C', counter: 0 }],
//     ])

//     public increment = (id: string) => {
//         const r = this.data.get(id)
//         if (r) {
//             r.counter = r.counter + 1
//         }
//     }
// }

// const fakeDatabase = new FakeDatabaseClass()

// interface NavigationContextType {
//     selectedRecordId: string
//     selectRecord: (id: string) => void
// }

// const NavigationContext = createContext<NavigationContextType | undefined>(undefined)

// const useNavigation = () => {
//     const context = useContext(NavigationContext);
//     if (context === undefined) {
//         throw new Error('useNavigation must be used within a NavigationPrvoider');
//     }
//     return context;
// }

// const NavigationProvider = ({ database, children }: { database: FakeDatabaseClass, children: ReactNode }) => {
//     const [selectedRecordId, setSelectedRecordId] = useState('')

//     const selectRecord = useCallback((id: string) => {
//         setSelectedRecordId(id)
//     }, [])

//     const value = { selectedRecordId, selectRecord }
//     return <NavigationContext.Provider value={value}>
//         {children}
//     </NavigationContext.Provider>
// }

// const Navigation = () => {
//   const ctx = useNavigation()
//   return (
//     <>
//         {Array.from(fakeDatabase.values()).map((record) => (
//             <label key={record.id}>{record.name}<input type='radio' value={record.id} checked={ctx.selectedRecordId === record.id} /></label>
//         ))}
//     </>
// )}

// interface EditorContextType {
//     id: string
//     name: string
//     counter: number
//     incrementCounter: () => void
// }

// const EditorContext = createContext<EditorContextType | undefined>(undefined)

// const useEditor = () => {
//     const context = useContext(EditorContext);
//     if (context === undefined) {
//         throw new Error('useEditor must be used within an EditorContext');
//     }
//     return context;
// }

// const EditorProvider = ({ children }: { children: ReactNode }) => {
//     const ctxNav = useNavigation()

//     const record = ctxNav.selectedRecordId.length > 0
//         ? fakeDatabase.get(ctxNav.selectedRecordId)
//         : null

//     const [id] = useState(record?.id ?? '')
//     const [name] = useState(record?.name ?? '')
//     const [counter, setCounter] = useState(record?.counter ?? 0)

//     const incrementCounter = () => {
//         const newCounter = counter + 1
//         setCounter(newCounter)
//         const r = fakeDatabase.get(id)
//         if (r) r.counter = newCounter
//     }
//     const value = { id, name, counter, incrementCounter }
//     return <EditorContext.Provider value={value}>
//         {children}
//     </EditorContext.Provider>
// }

// const Editor = () => {
//     const ctx = useEditor()
//     return (
//         <>
//             <div>Name: {ctx.name}</div>
//             <div>Counter: {ctx.counter} <input type='button' onClick={() => ctx.incrementCounter()} value='+' /></div>
//         </>
//     )
// }

// export default function App() {
//     return (
//         <div className="App">
//             <NavigationProvider>
//                 <Navigation />
//                 <EditorProvider>
//                     <Editor />
//                 </EditorProvider>
//             </NavigationProvider>
//         </div>
//     );
// }

