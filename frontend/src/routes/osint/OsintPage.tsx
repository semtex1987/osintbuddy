// @ts-nocheck
import React, { useCallback, useState, useRef, useMemo } from 'react';
import ReactFlow, {
  addEdge,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  ReactFlowProvider,
  useEdgesState,
} from 'reactflow';
import {
  ArchiveBoxIcon,
  ArrowRightCircleIcon,
  ChevronUpDownIcon,
  ClipboardIcon,
  DocumentDuplicateIcon,
  DocumentIcon,
  FolderOpenIcon,
  HeartIcon,
  MagnifyingGlassIcon,
  PaperClipIcon,
  PencilSquareIcon,
  ServerIcon,
  TrashIcon,
  UserPlusIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { EllipsisVerticalIcon, HomeIcon } from '@heroicons/react/20/solid';
import { HotKeys } from 'react-hotkeys';
import { Link, Route, Routes, useLocation, useParams } from 'react-router-dom';
import 'reactflow/dist/style.css';
import CommandPallet from '@/routes/osint/_components/CommandPallet';
import CustomNode from './CustomNode';
import classNames from 'classnames';
import NodeOptionsSlideOver from './_components/NodeOptionsSlideOver';
import { GoogleNode, CseNode, WebsiteNode, ResultNode } from './_components/Nodes';
import ContextMenu from './_components/ContextMenu';
import { IpIcon } from '@/components/Icons';

const keyMap = {
  TOGGLE_PALLET: ['shift+p'],
};

function BreadcrumbHeader({
  activeProject,
  toggleShowOptions,
}: {
  activeProject: string;
  toggleShowOptions: Function;
}) {
  const pages = [
    { name: 'Investigations', href: '#', current: false },
    { name: activeProject, href: '#', current: true },
  ];
  return (
    <nav
      className='flex justify-between fixed top-0 z-40 border-b border-gray-200 bg-dark-800 w-full'
      aria-label='Breadcrumb'
    >
      <ol role='list' className='flex w-full max-w-screen-xl space-x-4 px-4 sm:px-6 lg:px-8'>
        <li className='flex'>
          <div className='flex items-center'>
            <Link to='/app/dashboard' replace className='text-gray-400 hover:text-light-500'>
              <HomeIcon className='h-5 w-5 flex-shrink-0' aria-hidden='true' />
              <span className='sr-only'>Home</span>
            </Link>
          </div>
        </li>
        {pages.map((page) => (
          <li key={page.name} className='flex'>
            <div className='flex items-center'>
              <svg
                className='h-full w-6 flex-shrink-0 text-gray-300'
                viewBox='0 0 24 44'
                preserveAspectRatio='none'
                fill='currentColor'
                xmlns='http://www.w3.org/2000/svg'
                aria-hidden='true'
              >
                <path d='M.293 0l22 22-22 22h1.414l22-22-22-22H.293z' />
              </svg>
              <button
                className='ml-4 text-sm font-medium text-light-500 hover:text-light-700'
                aria-current={page.current ? 'page' : undefined}
              >
                {page.name}
              </button>
            </div>
          </li>
        ))}
        <button
          type='button'
          onClick={() => toggleShowOptions()}
          className='leading-3 ml-auto relative inline-flex items-center rounded border border-gray-300 bg-white px-2.5  text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
        >
          Add nodes
        </button>
      </ol>
    </nav>
  );
}
const tabs = [
  { name: 'Google Search', href: 'gsearch', current: true },
  { name: 'CSE Search', href: 'cses', current: false },
  { name: 'Nodes', href: 'nodes', current: false },
];
let nodeId = 0;
const getNodeId = () => `node_${nodeId++}`;
const initialEdges = [];
const initialNodes = [];

const DnDFlow = ({
  reactFlowWrapper,
  nodes,
  setNodes,
  onNodesChange,
  edges,
  setEdges,
  onEdgesChange,
  reactFlowInstance,
  setReactFlowInstance,
  deleteNode,
  addNode,
  addEdge,
}) => {
  const onConnect = useCallback((connection) => setEdges((eds) => addEdge(connection, edges)), [setEdges]);

  const onEdgeUpdate = useCallback(
    (oldEdge, newConnection) => setEdges((els) => updateEdge(oldEdge, newConnection, els)),
    []
  );
  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const type = event.dataTransfer.getData('application/reactflow');

      // check if the dropped element is valid
      if (typeof type === 'undefined' || !type) {
        return;
      }

      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });
      const newNode = {
        id: `${type.charAt(0)}${getNodeId()}`,
        type,
        position,
        data: { label: `${type} node` },
      };
      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance]
  );

  const nodeTypes = useMemo(() => {
    return {
      website: (data) => <WebsiteNode flowData={data} />,
      google: (data) => <GoogleNode addNode={addNode} addEdge={addEdge} flowData={data} />,
      cse: () => <CseNode data={'TODO: Add cse node'} />,
      result: (data) => <ResultNode addNode={addNode} addEdge={addEdge} data={data} />,
    };
  }, []);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlowProvider>
        <div style={{ width: '100%', height: '100%' }} ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onEdgeUpdate={onEdgeUpdate}
            onDragOver={onDragOver}
            fitView
            nodeTypes={nodeTypes}
          >
            <Controls />
          </ReactFlow>
        </div>
      </ReactFlowProvider>
    </div>
  );
};
let id = 0;

export default function OsintPage() {
  const reactFlowWrapper = useRef(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);

  function addNode(id, type, position, data) {
    const newNode = {
      id,
      type,
      position,
      data,
    };
    setNodes((nds) => nds.concat(newNode));
    console.log(nodes[nodes.length - 1]);

    return newNode;
  }

  function addEdge(source, target) {
    const newEdge = {
      source,
      target,
      sourceHandle: 'r1',
      targetHandle: 'l1',
    };
    setEdges((eds) => eds.concat(newEdge));
  }

  function deleteNode(nodeId) {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
  }

  const params = useParams();
  const location = useLocation();
  const activeCase = location.state.activeCase;

  const [showNodeOptions, setShowNodeOptions] = useState<boolean>(false);
  const [showCommandPallet, setShowCommandPallet] = useState<boolean>(false);

  const [activePanelTab, setActivePanelTab] = useState<string>(tabs[0].name);
  console.log(params, activeCase);

  const togglePallet = () => setShowCommandPallet(!showCommandPallet);
  const toggleShowNodeOptions = () => setShowNodeOptions(!showNodeOptions);
  const hideCommandPallet = () => setShowCommandPallet(false);

  const handlers = {
    TOGGLE_PALLET: togglePallet,
    CLOSE_PALLET: hideCommandPallet,
  };
  const getId = () => `node_${nodeId++}`;
  return (
    <HotKeys keyMap={keyMap} handlers={handlers}>
      <div className='h-screen flex flex-col w-full'>
        <BreadcrumbHeader toggleShowOptions={toggleShowNodeOptions} activeProject={activeCase.name} />
        <div className='flex h-full'>
          <DnDFlow
            addNode={addNode}
            deleteNode={deleteNode}
            addEdge={addEdge}
            reactFlowWrapper={reactFlowWrapper}
            nodes={nodes}
            setNodes={setNodes}
            onNodesChange={onNodesChange}
            edges={edges}
            setEdges={setEdges}
            onEdgesChange={onEdgesChange}
            reactFlowInstance={reactFlowInstance}
            setReactFlowInstance={setReactFlowInstance}
          />
        </div>
        <CommandPallet
          toggleShowOptions={toggleShowNodeOptions}
          isOpen={showCommandPallet}
          setOpen={setShowCommandPallet}
        />
      </div>
      <NodeOptionsSlideOver showOptions={showNodeOptions} setShowOptions={setShowNodeOptions} />
      <ContextMenu
        menu={({ node }) => {
          let nodeType = null;
          if (node) {
            nodeType = node.classList[1].split('-');
            nodeType = nodeType[nodeType.length - 1];
          }
          return (
            <>
              <div className='relative z-50 inline-block text-left'>
                <ul className='absolute right-0 z-10 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none'>
                  <div className='py-1'>
                    <div>
                      <div
                        href='#'
                        className={classNames(
                          false ? 'bg-light-500 text-gray-900' : 'text-gray-700',
                          'group flex items-center px-4 py-2 text-sm font-display'
                        )}
                      >
                        <span className='text-dark-900 font-semibold font-display mr-3'>ID: </span>
                        {node ? node.getAttribute('data-id') : 'No node selected'}
                        {nodeType && (
                          <span className='inline-flex ml-auto items-center rounded-full bg-blue-100 px-3 py-0.5 text-sm font-medium text-blue-800'>
                            {nodeType.charAt(0).toUpperCase() + nodeType.slice(1)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {nodeType === 'website' && (
                    <>
                      <div className='py-1'>
                        <div>
                          <button
                            href='#'
                            className={classNames(
                              'hover:bg-light-500 hover:text-gray-900 text-gray-700 group flex items-center px-4 py-2 text-sm w-full'
                            )}
                          >
                            <IpIcon
                              className='mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500'
                              aria-hidden='true'
                            />
                            To IP
                          </button>
                        </div>
                        <div>
                          <button
                            href='#'
                            className={classNames(
                              'hover:bg-light-500 hover:text-gray-900 text-gray-700 group flex items-center px-4 py-2 text-sm w-full'
                            )}
                          >
                            <PaperClipIcon
                              className='mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500'
                              aria-hidden='true'
                            />
                            To Backlinks
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                  {nodeType === 'result' && (
                    <div className='py-1'>
                      <div>
                        <button
                          onClick={(event) => {
                            let rect = node.getBoundingClientRect();
                            let newNode = addNode(
                              `rw${getId()}`,
                              'website',
                              {
                                x: rect.x + rect.left + node.scrollWidth,
                                // y: rIdx % 2 === 0 ? (totalLines * 22)  : ((totalLines - rIdx) * 22) ,
                                y: rect.y,
                              },
                              {
                                label: {
                                  url: node.querySelectorAll('[data-type]')[0].innerText,
                                },
                              }
                            );
                            addEdge(node.getAttribute('data-id'), newNode.id);
                          }}
                          className={classNames(
                            'hover:bg-light-500 hover:text-gray-900 text-gray-700 group flex items-center px-4 py-2 text-sm w-full'
                          )}
                        >
                          <IpIcon className='mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500' aria-hidden='true' />
                          To Website
                        </button>
                      </div>
                    </div>
                  )}
                  {nodeType === 'google' && (
                    <div className='py-1'>
                      <div>
                        <button
                          href='#'
                          className={classNames(
                            'hover:bg-light-500 hover:text-gray-900 text-gray-700 group flex items-center px-4 py-2 text-sm w-full'
                          )}
                        >
                          <HeartIcon
                            className='mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500'
                            aria-hidden='true'
                          />
                          Add to favorites
                        </button>
                      </div>
                    </div>
                  )}
                  {nodeType && (
                    <div className='py-1'>
                      <div>
                        <button
                          onClick={() => deleteNode(node.getAttribute('data-id'))}
                          type='button'
                          className={classNames(
                            'hover:bg-light-500 hover:text-gray-900 text-gray-700 group flex items-center px-4 py-2 text-sm w-full'
                          )}
                        >
                          <TrashIcon
                            className='mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500'
                            aria-hidden='true'
                          />
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </ul>
              </div>
            </>
          );
        }}
      />
    </HotKeys>
  );
}
