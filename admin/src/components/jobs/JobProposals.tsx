import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../store';
import { updateJobStatus } from '../../store/slices/job';
import axiosInstance from '../../services/axiosConfig';

interface ProposalUser {
  _id: string;
  fullName: string;
  email: string;
  profilePicture: string;
}

export interface Proposal {
  _id: string;
  userId: ProposalUser;
  coverLetter: string;
  cv: string;
  proposedAmount: number;
  status: 'pending' | 'accepted' | 'rejected';
  submittedAt: string;
}

interface JobProposalsProps {
  proposals: Proposal[];
  isOpen: boolean;
  onClose: () => void;
  jobTitle: string;
  jobId?: string;
}

const JobProposals: React.FC<JobProposalsProps> = ({ proposals, isOpen, onClose, jobTitle, jobId }) => {
  const [activeTab, setActiveTab] = useState<'pending' | 'accepted' | 'rejected'>('pending');
  const [localProposals, setLocalProposals] = useState<Proposal[]>(proposals);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  
  // Update local proposals when props change
  React.useEffect(() => {
    setLocalProposals(proposals);
  }, [proposals]);
  
  if (!isOpen) return null;
  
  const filteredProposals = localProposals.filter(proposal => proposal.status === activeTab);
  
  // Function to update proposal status
  const handleStatusChange = async (proposalId: string, newStatus: 'accepted' | 'rejected') => {
    try {
      setLoadingId(proposalId);
      
      // In a real app, you would call your API here
      // For example:
      if (jobId) {
        console.log(`Updating proposal ${proposalId} for job ${jobId} to status: ${newStatus}`);
        // Uncomment below when API is ready
        // await axiosInstance.patch(`/jobs/${jobId}/proposals/${proposalId}`, { status: newStatus });
      }
      
      // For now, just update the local state
      const updatedProposals = localProposals.map(proposal => 
        proposal._id === proposalId ? { ...proposal, status: newStatus } : proposal
      );
      
      setLocalProposals(updatedProposals);
      
      // Show success notification
      alert(`Proposal ${newStatus} successfully`);
    } catch (error) {
      console.error('Error updating proposal status:', error);
      alert('Failed to update proposal status');
    } finally {
      setLoadingId(null);
    }
  };
  
  // Function to format the date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const BASE_URL = (import.meta.env.VITE_BASE_URL || 'https://api.dataknowledge.in/').replace(/\/+$/, '') + '/';
  
  return (
    <div className="fixed inset-0 bg-white/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Proposals for "{jobTitle}"</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 focus:outline-none"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Tabs */}
        
        
        {/* Proposals Content */}
        <div className="overflow-y-auto p-6" style={{ maxHeight: 'calc(80vh - 132px)' }}>
          {filteredProposals.length === 0 ? (
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-gray-100">No {activeTab} proposals</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                There are no proposals with {activeTab} status for this job.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredProposals.map((proposal) => (
                <li key={proposal._id} className="py-6">
                  <div className="flex items-start space-x-4">
                    {/* <div className="flex-shrink-0">
                      <img 
                        className="h-10 w-10 rounded-full object-cover" 
                        src={proposal.userId.profilePicture.includes('default') ? 
                          '/images/user/avatar.png' : 
                          `${BASE_URL}${proposal.userId.profilePicture}`
                        } 
                        alt={proposal.userId.fullName} 
                      />
                    </div> */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {proposal.userId.fullName}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(proposal.submittedAt)}
                        </p>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {proposal.userId.email}
                      </p>
                      <div className="mt-2">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-200">Cover Letter:</h4>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">
                          {proposal.coverLetter}
                        </p>
                      </div>
                      <div className="mt-3 flex justify-between">
                        <div className="flex items-center space-x-4">
                          <a 
                            href={proposal.cv && proposal.cv.startsWith('http') 
                              ? proposal.cv 
                              : proposal.cv 
                                ? `${BASE_URL.endsWith('/') ? BASE_URL : `${BASE_URL}/`}${proposal.cv.startsWith('/') ? proposal.cv.substring(1) : proposal.cv}`
                                : '#'
                            }
                            target="_blank" 
                            rel="noopener noreferrer"
                            onClick={(e) => {
                              if (!proposal.cv) return;
                              e.preventDefault();
                              const baseUrlWithSlash = BASE_URL.endsWith('/') ? BASE_URL : `${BASE_URL}/`;
                              const cvPath = proposal.cv.startsWith('/') ? proposal.cv.substring(1) : proposal.cv;
                              const url = proposal.cv.startsWith('http') ? proposal.cv : `${baseUrlWithSlash}${cvPath}`;
                              console.log('Opening CV URL:', url);
                              window.open(url, '_blank', 'noopener,noreferrer');
                            }}
                            className="flex items-center text-sm text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                          >
                            <svg className="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13l-3 3m0 0l-3-3m3 3V8m0 13a9 9 0 110-18 9 9 0 010 18z" />
                            </svg>
                            View CV
                          </a>
                          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                            Proposed: ${proposal.proposedAmount}
                          </span>
                        </div>
                       
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobProposals;
