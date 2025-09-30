import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faNetworkWired, 
  faCamera, 
  faWifi, 
  faExclamationTriangle,
  faInfoCircle,
  faExpand
} from '@fortawesome/free-solid-svg-icons';

const NetworkTopology = ({ cameras, darkMode = false, title = "Network Topology" }) => {
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'network'
  const [animationEnabled, setAnimationEnabled] = useState(true);

  // Group cameras by subnet for network view
  const groupCamerasBySubnet = () => {
    const subnets = {};
    cameras.forEach(camera => {
      const subnet = camera.ip.split('.').slice(0, 3).join('.');
      if (!subnets[subnet]) {
        subnets[subnet] = [];
      }
      subnets[subnet].push(camera);
    });
    return subnets;
  };

  const subnets = groupCamerasBySubnet();

  // Calculate grid dimensions
  const getGridDimensions = () => {
    const count = cameras.length;
    const cols = Math.ceil(Math.sqrt(count));
    const rows = Math.ceil(count / cols);
    return { cols, rows };
  };

  const { cols, rows } = getGridDimensions();

  // Get status color
  const getStatusColor = (camera) => {
    if (camera.reachable === 'true') {
      const rtt = camera.rtt_ms || 0;
      if (rtt < 30) return 'text-green-500 bg-green-500/20 border-green-500';
      if (rtt < 60) return 'text-yellow-500 bg-yellow-500/20 border-yellow-500';
      return 'text-orange-500 bg-orange-500/20 border-orange-500';
    }
    return 'text-red-500 bg-red-500/20 border-red-500';
  };

  // Get pulse animation class
  const getPulseClass = (camera) => {
    if (!animationEnabled) return '';
    if (camera.reachable === 'true') {
      return 'animate-pulse';
    }
    return 'animate-bounce';
  };

  const CameraNode = ({ camera, index }) => {
    const statusColor = getStatusColor(camera);
    const pulseClass = getPulseClass(camera);
    
    return (
      <div
        className={`relative group cursor-pointer transition-all duration-300 transform hover:scale-110
          ${selectedCamera?.id === camera.id ? 'scale-110 z-10' : ''}`}
        onClick={() => setSelectedCamera(selectedCamera?.id === camera.id ? null : camera)}
      >
        {/* Camera Node */}
        <div className={`w-16 h-16 rounded-xl border-2 flex items-center justify-center
          ${statusColor} ${pulseClass}
          hover:shadow-lg transition-all duration-300
          ${selectedCamera?.id === camera.id ? 'ring-4 ring-blue-500/50' : ''}`}
        >
          <FontAwesomeIcon 
            icon={faCamera} 
            className="text-xl"
          />
        </div>
        
        {/* Camera Label */}
        <div className={`absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs font-medium
          ${darkMode ? 'text-gray-300' : 'text-gray-600'}
          group-hover:font-bold transition-all duration-200`}
        >
          {camera.name.replace('Camera ', 'C')}
        </div>
        
        {/* RTT Badge */}
        {camera.reachable === 'true' && camera.rtt_ms && (
          <div className={`absolute -top-2 -right-2 px-2 py-1 rounded-full text-xs font-bold
            ${camera.rtt_ms < 30 ? 'bg-green-500 text-white' :
              camera.rtt_ms < 60 ? 'bg-yellow-500 text-black' : 'bg-orange-500 text-white'}`}
          >
            {camera.rtt_ms}ms
          </div>
        )}
        
        {/* Error Indicator */}
        {camera.reachable === 'false' && (
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
            <FontAwesomeIcon icon={faExclamationTriangle} className="text-white text-xs" />
          </div>
        )}
      </div>
    );
  };

  const GridView = () => (
    <div 
      className="grid gap-8 justify-items-center p-8"
      style={{ 
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        minHeight: '400px'
      }}
    >
      {cameras.map((camera, index) => (
        <CameraNode key={camera.id} camera={camera} index={index} />
      ))}
    </div>
  );

  const NetworkView = () => (
    <div className="p-8 space-y-8">
      {Object.entries(subnets).map(([subnet, subnetCameras]) => (
        <div key={subnet} className={`p-6 rounded-lg border
          ${darkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'}`}
        >
          <div className="flex items-center gap-3 mb-6">
            <FontAwesomeIcon icon={faNetworkWired} className="text-blue-500" />
            <h3 className="text-lg font-semibold">
              Subnet: {subnet}.x
            </h3>
            <span className={`px-3 py-1 rounded-full text-sm font-medium
              ${darkMode ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-800'}`}
            >
              {subnetCameras.length} cameras
            </span>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-6">
            {subnetCameras.map((camera, index) => (
              <CameraNode key={camera.id} camera={camera} index={index} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className={`rounded-xl shadow-lg border transition-all duration-300
      ${darkMode
        ? 'bg-gray-800 border-gray-700 text-slate-200'
        : 'bg-white border-gray-200 text-gray-900'}
      hover:shadow-xl`}
    >
      {/* Header with controls */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <FontAwesomeIcon icon={faNetworkWired} className="text-blue-500 text-xl" />
            <h2 className="text-xl font-bold">{title}</h2>
          </div>
          
          <div className="flex flex-wrap gap-3">
            {/* View Mode Toggle */}
            <div className="flex rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-4 py-2 text-sm font-medium transition-colors
                  ${viewMode === 'grid'
                    ? darkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                    : darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                Grid View
              </button>
              <button
                onClick={() => setViewMode('network')}
                className={`px-4 py-2 text-sm font-medium transition-colors
                  ${viewMode === 'network'
                    ? darkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                    : darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                Network View
              </button>
            </div>
            
            {/* Animation Toggle */}
            <button
              onClick={() => setAnimationEnabled(!animationEnabled)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
                ${animationEnabled
                  ? darkMode ? 'bg-green-600 text-white' : 'bg-green-500 text-white'
                  : darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
            >
              {animationEnabled ? 'Animations On' : 'Animations Off'}
            </button>
          </div>
        </div>
        
        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500"></div>
            <span>Excellent (&lt;30ms)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-yellow-500"></div>
            <span>Good (30-60ms)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-orange-500"></div>
            <span>Fair (&gt;60ms)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-500"></div>
            <span>Offline</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative">
        {viewMode === 'grid' ? <GridView /> : <NetworkView />}
      </div>

      {/* Selected Camera Details */}
      {selectedCamera && (
        <div className={`p-6 border-t border-gray-200 dark:border-gray-700
          ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}
        >
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2">{selectedCamera.name}</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium">IP Address:</span>
                  <div className="font-mono">{selectedCamera.ip}</div>
                </div>
                <div>
                  <span className="font-medium">Status:</span>
                  <div className={`font-medium ${
                    selectedCamera.reachable === 'true' ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {selectedCamera.reachable === 'true' ? 'Online' : 'Offline'}
                  </div>
                </div>
                <div>
                  <span className="font-medium">Response Time:</span>
                  <div>{selectedCamera.rtt_ms ? `${selectedCamera.rtt_ms}ms` : 'N/A'}</div>
                </div>
                <div>
                  <span className="font-medium">TTL:</span>
                  <div>{selectedCamera.ttl || 'N/A'}</div>
                </div>
              </div>
            </div>
            <button
              onClick={() => setSelectedCamera(null)}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors
                ${darkMode ? 'bg-gray-600 hover:bg-gray-500 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NetworkTopology;