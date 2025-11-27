import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Grid,
  Card,
  IconButton,
  Chip,
  LinearProgress,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider
} from '@mui/material';
import {
  ArrowBack,
  Search,
  Delete,
  CloudUpload,
  MenuBook,
  ExpandMore,
  CheckBox as CheckBoxIcon,
  CheckBoxOutlineBlank as CheckBoxOutlineBlankIcon,
  DeleteSweep
} from '@mui/icons-material';
import libraryService from '../services/libraryService';
import zipHandler from '../services/zipHandler';

function Library({ onBack, onOpenPdf }) {
  const [pdfs, setPdfs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Upload dialog state
  const [uploadDialog, setUploadDialog] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const [uploadMetadata, setUploadMetadata] = useState({
    subject: '',
    class: '',
    customSubject: ''
  });
  
  // ZIP extraction state
  const [zipExtracting, setZipExtracting] = useState(false);
  const [zipProgress, setZipProgress] = useState({ current: 0, total: 0, message: '' });
  const [extractedPdfs, setExtractedPdfs] = useState([]);
  
  // Bulk selection state
  const [selectedPdfs, setSelectedPdfs] = useState(new Set());
  const [selectMode, setSelectMode] = useState(false);

  useEffect(() => {
    loadLibrary();
  }, []);

  const loadLibrary = async () => {
    setLoading(true);
    try {
      const allPdfs = await libraryService.getAllLibraryItems();
      setPdfs(allPdfs);
    } catch (error) {
      console.error('❌ Failed to load library:', error);
      alert(`Failed to load library:\n${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (id, title) => {
    if (window.confirm(`Remove "${title}" from library?`)) {
      try {
        await libraryService.removePDFFromLibrary(id);
        await loadLibrary();
      } catch (error) {
        console.error('❌ Failed to remove PDF:', error);
        alert(`Failed to remove PDF:\n${error.message}`);
      }
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    // Check if it's a ZIP file
    if (zipHandler.isZipFile(file)) {
      await handleZipUpload(file);
      return;
    }
    
    // Regular PDF upload
    if (file.type !== 'application/pdf') {
      alert('Please select a valid PDF or ZIP file');
      return;
    }
    
    // Open dialog for metadata
    setPendingFile(file);
    setUploadMetadata({
      subject: '',
      class: '',
      customSubject: ''
    });
    setUploadDialog(true);
  };
  
  const handleZipUpload = async (zipFile) => {
    setZipExtracting(true);
    setZipProgress({ current: 0, total: 0, message: 'Reading ZIP file...' });
    
    try {
      // Extract all PDFs from ZIP
      const pdfFiles = await zipHandler.extractZipFile(
        zipFile,
        (current, total, message) => {
          setZipProgress({ current, total, message });
        }
      );
      
      if (pdfFiles.length === 0) {
        alert('No PDF files found in the ZIP archive');
        setZipExtracting(false);
        return;
      }
      
      // Show metadata confirmation dialog
      setExtractedPdfs(pdfFiles);
      const detectedMetadata = pdfFiles[0].metadata;
      
      console.log('📋 First PDF metadata:', detectedMetadata);
      console.log('📋 Collection from metadata:', detectedMetadata.collection);
      console.log('📋 ZIP filename:', zipFile.name);
      
      // Ensure we have a collection name
      let bookName = detectedMetadata.collection || zipFile.name.replace('.zip', '');
      
      // If bookName looks like a code (e.g., "hecu1dd"), make it more readable
      if (bookName.length < 10 && /^[a-z0-9]+$/i.test(bookName)) {
        console.log('📋 Book name is code-like, converting to uppercase');
        bookName = bookName.toUpperCase();
      }
      
      console.log('📚 ===== FINAL BOOK NAME =====:', bookName);
      console.log('📋 Full detected metadata:', JSON.stringify(detectedMetadata, null, 2));
      
      setUploadMetadata({
        subject: detectedMetadata.subject || '',
        class: detectedMetadata.class || '',
        customSubject: '',
        bookName: bookName
      });
      setZipExtracting(false);
      setUploadDialog(true);
      
    } catch (error) {
      console.error('❌ ZIP extraction error:', error);
      alert(`Failed to extract ZIP file:\n${error.message}`);
      setZipExtracting(false);
    }
  };
  
  const handleConfirmUpload = async () => {
    const subject = uploadMetadata.subject === 'Other' 
      ? uploadMetadata.customSubject || 'General'
      : uploadMetadata.subject || 'General';
    
    // Batch upload from ZIP
    if (extractedPdfs.length > 0) {
      setZipExtracting(true);
      setZipProgress({ current: 0, total: extractedPdfs.length, message: 'Adding PDFs to library...' });
      
      try {
        let successCount = 0;
        
        for (let i = 0; i < extractedPdfs.length; i++) {
          const pdfData = extractedPdfs[i];
          setZipProgress({ 
            current: i + 1, 
            total: extractedPdfs.length, 
            message: `Adding ${pdfData.filename}...` 
          });
          
          // Determine collection name with priority
          const collectionName = uploadMetadata.bookName || pdfData.metadata.collection || 'Book Collection';
          
          console.log('📚 ===== ADDING PDF TO LIBRARY =====');
          console.log('📚 uploadMetadata.bookName:', uploadMetadata.bookName);
          console.log('📚 pdfData.metadata.collection:', pdfData.metadata.collection);
          console.log('📚 Final collectionName:', collectionName);
          console.log('📚 Chapter:', pdfData.metadata.chapter);
          console.log('📚 Filename:', pdfData.filename);
          
          const pdfName = pdfData.metadata.type === 'chapter'
            ? `${collectionName} - ${pdfData.metadata.title}`
            : `${collectionName} - ${pdfData.metadata.title}`;
          
          const libraryItem = await libraryService.addPDFToLibrary(pdfData.file, {
            name: pdfName,
            subject: subject,
            class: uploadMetadata.class || null,
            workspace: 'My Files',
            collection: collectionName,
            chapter: pdfData.metadata.chapter,
            chapterTitle: pdfData.metadata.title,
            totalPages: pdfData.metadata.totalPages || 0,
            pdfTitle: pdfData.metadata.pdfTitle
          });
          
          console.log('✅ PDF added with collection:', libraryItem.collection);
          
          // Store thumbnail (individual PDF thumbnail or cover image)
          const thumbnailToStore = pdfData.metadata.thumbnail || pdfData.metadata.coverImage;
          if (thumbnailToStore) {
            try {
              await libraryService.storeThumbnail(libraryItem.id, thumbnailToStore);
              console.log('✅ Thumbnail stored for', pdfData.metadata.title);
            } catch (error) {
              console.warn('⚠️ Failed to store thumbnail:', error);
            }
          }
          
          successCount++;
        }
        
        console.log(`✅ Successfully added ${successCount} PDFs from ZIP`);
        await loadLibrary();
        setUploadDialog(false);
        setExtractedPdfs([]);
        setZipExtracting(false);
        alert(`✅ Successfully added ${successCount} PDFs to library!`);
        
      } catch (error) {
        console.error('❌ Failed to add PDFs from ZIP:', error);
        alert(`Failed to add some PDFs:\n${error.message}`);
        setZipExtracting(false);
      }
      return;
    }
    
    // Single PDF upload
    if (!pendingFile) return;
    
    console.log('📄 Adding PDF to library:', pendingFile.name);
    
    try {
      const libraryItem = await libraryService.addPDFToLibrary(pendingFile, {
        name: pendingFile.name.replace('.pdf', ''),
        subject: subject,
        class: uploadMetadata.class || null,
        workspace: 'My Files'
      });
      console.log('✅ PDF added successfully:', libraryItem);
      await loadLibrary();
      setUploadDialog(false);
      setPendingFile(null);
      alert(`✅ "${pendingFile.name}" added to library!`);
    } catch (error) {
      console.error('❌ Failed to add PDF:', error);
      alert(`Failed to add PDF to library:\n${error.message}\n\nPlease try again.`);
    }
  };
  
  const handleCancelUpload = () => {
    setUploadDialog(false);
    setPendingFile(null);
    setExtractedPdfs([]);
    setUploadMetadata({ subject: '', class: '', customSubject: '', bookName: '' });
  };
  
  const handleBulkDelete = async () => {
    if (selectedPdfs.size === 0) return;
    
    if (window.confirm(`Delete ${selectedPdfs.size} selected PDFs?`)) {
      try {
        for (const pdfId of selectedPdfs) {
          await libraryService.removePDFFromLibrary(pdfId);
        }
        await loadLibrary();
        setSelectedPdfs(new Set());
        setSelectMode(false);
        alert(`✅ Deleted ${selectedPdfs.size} PDFs`);
      } catch (error) {
        console.error('❌ Failed to delete PDFs:', error);
        alert('Failed to delete some PDFs');
      }
    }
  };
  
  const toggleSelectPdf = (pdfId) => {
    const newSelected = new Set(selectedPdfs);
    if (newSelected.has(pdfId)) {
      newSelected.delete(pdfId);
    } else {
      newSelected.add(pdfId);
    }
    setSelectedPdfs(newSelected);
  };
  
  const selectAllInCollection = (collectionPdfs) => {
    const newSelected = new Set(selectedPdfs);
    const allSelected = collectionPdfs.every(pdf => newSelected.has(pdf.id));
    
    if (allSelected) {
      // Deselect all in collection
      collectionPdfs.forEach(pdf => newSelected.delete(pdf.id));
    } else {
      // Select all in collection
      collectionPdfs.forEach(pdf => newSelected.add(pdf.id));
    }
    setSelectedPdfs(newSelected);
  };

  const filteredPdfs = pdfs.filter(pdf =>
    pdf.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pdf.collection?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Group PDFs by collection
  const groupedPdfs = filteredPdfs.reduce((groups, pdf) => {
    const collection = pdf.collection || 'Uncategorized';
    if (!groups[collection]) {
      groups[collection] = [];
    }
    groups[collection].push(pdf);
    return groups;
  }, {});
  
  // Sort PDFs within each group by chapter number
  Object.keys(groupedPdfs).forEach(collection => {
    groupedPdfs[collection].sort((a, b) => {
      const chapterA = a.chapter || 999;
      const chapterB = b.chapter || 999;
      return chapterA - chapterB;
    });
  });

  const totalPages = pdfs.reduce((sum, pdf) => sum + (pdf.totalPages || 0), 0);
  const avgProgress = pdfs.length > 0
    ? pdfs.reduce((sum, pdf) => sum + (pdf.progress || 0), 0) / pdfs.length
    : 0;
  
  // Get unique subjects and classes
  const uniqueSubjects = [...new Set(pdfs.map(pdf => pdf.subject).filter(Boolean))];
  const uniqueClasses = [...new Set(pdfs.map(pdf => pdf.class).filter(Boolean))];
  
  // Subject and class distribution
  const subjectCounts = pdfs.reduce((acc, pdf) => {
    if (pdf.subject) {
      acc[pdf.subject] = (acc[pdf.subject] || 0) + 1;
    }
    return acc;
  }, {});
  
  const classCounts = pdfs.reduce((acc, pdf) => {
    if (pdf.class) {
      acc[pdf.class] = (acc[pdf.class] || 0) + 1;
    }
    return acc;
  }, {});

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#fafafa', overflow: 'hidden' }}>
      <Container maxWidth="lg" sx={{ flex: 1, display: 'flex', flexDirection: 'column', py: 3, overflow: 'hidden', height: '100%' }}>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <IconButton onClick={onBack} sx={{ mr: 2 }}>
              <ArrowBack />
            </IconButton>
            <Typography variant="h5" fontWeight={600}>
              My Library
            </Typography>
          </Box>
          
          {/* Quick Stats */}
          {pdfs.length > 0 && (
            <Box sx={{ ml: 7, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Typography variant="body2" color="text.secondary">
                📚 {pdfs.length} {pdfs.length === 1 ? 'PDF' : 'PDFs'}
              </Typography>
              {uniqueSubjects.length > 0 && (
                <Typography variant="body2" color="text.secondary">
                  • 📖 {uniqueSubjects.length} {uniqueSubjects.length === 1 ? 'Subject' : 'Subjects'}
                </Typography>
              )}
              {uniqueClasses.length > 0 && (
                <Typography variant="body2" color="text.secondary">
                  • 🎓 {uniqueClasses.length} {uniqueClasses.length === 1 ? 'Class' : 'Classes'}
                </Typography>
              )}
              <Typography variant="body2" color="text.secondary">
                • 📄 {totalPages.toLocaleString()} Total Pages
              </Typography>
            </Box>
          )}
        </Box>

        {/* Stats & Actions */}
        <Paper elevation={0} sx={{ p: 2, mb: 3, border: '1px solid', borderColor: 'divider' }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" fontWeight={600} color="primary.main">
                  {pdfs.length}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  PDFs
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" fontWeight={600} color="primary.main">
                  {totalPages}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Total Pages
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" fontWeight={600} color="primary.main">
                  {avgProgress.toFixed(0)}%
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Avg Progress
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                component="label"
                variant="contained"
                fullWidth
                startIcon={<CloudUpload />}
                size="small"
              >
                Add PDF
                <input
                  type="file"
                  hidden
                  accept="application/pdf,.zip"
                  onChange={handleFileUpload}
                />
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Search & Bulk Actions */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2, flexShrink: 0, alignItems: 'center' }}>
          <TextField
            fullWidth
            placeholder="Search books and PDFs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
          {selectMode && selectedPdfs.size > 0 && (
            <Button
              variant="contained"
              color="error"
              startIcon={<DeleteSweep />}
              onClick={handleBulkDelete}
              sx={{ whiteSpace: 'nowrap' }}
            >
              Delete ({selectedPdfs.size})
            </Button>
          )}
        </Box>

        {/* Scrollable PDF List */}
        <Box sx={{ flex: 1, overflow: 'auto', pr: 1, minHeight: 0 }}>
          {loading ? (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">Loading library...</Typography>
            </Box>
          ) : filteredPdfs.length === 0 ? (
          <Paper 
            elevation={0} 
            sx={{ 
              p: 6, 
              textAlign: 'center',
              border: '1px dashed',
              borderColor: 'divider'
            }}
          >
            <MenuBook sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              {searchTerm ? 'No PDFs found' : 'Your library is empty'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {searchTerm ? 'Try a different search term' : 'Upload your first PDF to get started'}
            </Typography>
            {!searchTerm && (
              <Button
                component="label"
                variant="contained"
                startIcon={<CloudUpload />}
              >
                Upload PDF
                <input
                  type="file"
                  hidden
                  accept="application/pdf,.zip"
                  onChange={handleFileUpload}
                />
              </Button>
            )}
          </Paper>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {Object.entries(groupedPdfs).map(([collection, collectionPdfs]) => {
                const firstPdf = collectionPdfs[0];
                const totalPages = collectionPdfs.reduce((sum, pdf) => sum + (pdf.totalPages || 0), 0);
                const avgProgress = collectionPdfs.reduce((sum, pdf) => sum + (pdf.progress || 0), 0) / collectionPdfs.length;
                const allSelected = collectionPdfs.every(pdf => selectedPdfs.has(pdf.id));
                const someSelected = collectionPdfs.some(pdf => selectedPdfs.has(pdf.id));

                return (
                  <Accordion 
                    key={collection}
                    elevation={0}
                    sx={{ 
                      border: '1px solid',
                      borderColor: 'divider',
                      '&:before': { display: 'none' },
                      borderRadius: '8px !important',
                      overflow: 'hidden'
                    }}
                  >
                    <AccordionSummary 
                      expandIcon={<ExpandMore />}
                      sx={{
                        bgcolor: 'background.paper',
                        '&:hover': { bgcolor: '#f5f5f5' }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 2 }}>
                        {/* Collection Icon/Cover */}
                        {firstPdf.thumbnailUrl ? (
                          <Box
                            component="img"
                            src={firstPdf.thumbnailUrl}
                            alt={collection}
                            sx={{
                              width: 60,
                              height: 80,
                              objectFit: 'cover',
                              borderRadius: 1,
                              boxShadow: 1
                            }}
                          />
                        ) : (
                          <MenuBook sx={{ fontSize: 40, color: 'primary.main' }} />
                        )}
                        
                        {/* Collection Info */}
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Typography variant="h6" fontWeight={600}>
                              {collection}
                            </Typography>
                            {/* Select Mode Button */}
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (selectMode) {
                                  selectAllInCollection(collectionPdfs);
                                } else {
                                  setSelectMode(true);
                                }
                              }}
                              sx={{ ml: 1 }}
                            >
                              {selectMode ? (
                                allSelected ? <CheckBoxIcon color="primary" /> : 
                                someSelected ? <CheckBoxIcon sx={{ opacity: 0.5 }} /> : 
                                <CheckBoxOutlineBlankIcon />
                              ) : (
                                <CheckBoxOutlineBlankIcon sx={{ opacity: 0.3 }} />
                              )}
                            </IconButton>
                          </Box>
                          
                          {/* Metadata */}
                          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
                            {firstPdf.subject && (
                              <Chip 
                                label={firstPdf.subject} 
                                size="small" 
                                sx={{ height: 20, fontSize: '0.7rem', bgcolor: 'primary.main', color: 'white' }} 
                              />
                            )}
                            {firstPdf.class && (
                              <Chip 
                                label={`Class ${firstPdf.class}`} 
                                size="small" 
                                sx={{ height: 20, fontSize: '0.7rem', bgcolor: 'secondary.main', color: 'white' }} 
                              />
                            )}
                            <Typography variant="caption" color="text.secondary">
                              📚 {collectionPdfs.length} {collectionPdfs.length === 1 ? 'PDF' : 'PDFs'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              • 📄 {totalPages.toLocaleString()} pages
                            </Typography>
                            {avgProgress > 0 && (
                              <Typography variant="caption" color="primary.main" fontWeight={500}>
                                • {avgProgress.toFixed(0)}% complete
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </Box>
                    </AccordionSummary>
                    
                    <AccordionDetails sx={{ p: 0, bgcolor: '#fafafa' }}>
                      <Divider />
                      {collectionPdfs.map((pdf, index) => {
              // Format size
              const formatSize = (bytes) => {
                if (!bytes) return 'Unknown';
                if (bytes < 1024) return `${bytes} B`;
                if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
                return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
              };

              // Format last accessed
              const formatLastAccessed = (isoString) => {
                if (!isoString) return 'Never';
                const date = new Date(isoString);
                const now = new Date();
                const diffMs = now - date;
                const diffMins = Math.floor(diffMs / 60000);
                const diffHours = Math.floor(diffMs / 3600000);
                const diffDays = Math.floor(diffMs / 86400000);

                if (diffMins < 1) return 'Just now';
                if (diffMins < 60) return `${diffMins}m ago`;
                if (diffHours < 24) return `${diffHours}h ago`;
                if (diffDays < 7) return `${diffDays}d ago`;
                return date.toLocaleDateString();
              };

                        return (
                          <Box
                            key={pdf.id}
                            sx={{ 
                              display: 'flex',
                              alignItems: 'center',
                              p: 2,
                              bgcolor: selectedPdfs.has(pdf.id) ? '#e3f2fd' : 'background.paper',
                              borderBottom: index < collectionPdfs.length - 1 ? '1px solid' : 'none',
                              borderColor: 'divider',
                              transition: 'all 0.2s',
                              '&:hover': {
                                bgcolor: selectedPdfs.has(pdf.id) ? '#bbdefb' : '#f5f5f5',
                                transform: 'translateX(4px)'
                              }
                            }}
                          >
                            {/* Selection Checkbox */}
                            {selectMode && (
                              <IconButton
                                size="small"
                                onClick={() => toggleSelectPdf(pdf.id)}
                                sx={{ mr: 1 }}
                              >
                                {selectedPdfs.has(pdf.id) ? 
                                  <CheckBoxIcon color="primary" /> : 
                                  <CheckBoxOutlineBlankIcon />
                                }
                              </IconButton>
                            )}
                            
                            {/* Chapter Number Badge */}
                            {pdf.chapter && (
                              <Box
                                sx={{
                                  width: 50,
                                  height: 50,
                                  flexShrink: 0,
                                  bgcolor: 'primary.main',
                                  color: 'white',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  borderRadius: 1,
                                  mr: 2,
                                  fontWeight: 700,
                                  fontSize: '1.2rem'
                                }}
                              >
                                {pdf.chapter}
                              </Box>
                            )}
                            
                            {!pdf.chapter && (
                              <Box
                                sx={{
                                  width: 50,
                                  height: 50,
                                  flexShrink: 0,
                                  bgcolor: '#f5f5f5',
                                  backgroundImage: pdf.thumbnailUrl ? `url(${pdf.thumbnailUrl})` : 'none',
                                  backgroundSize: 'cover',
                                  backgroundPosition: 'center',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  borderRadius: 1,
                                  mr: 2
                                }}
                              >
                                <MenuBook sx={{ fontSize: 30, color: 'text.disabled' }} />
                              </Box>
                            )}

                            {/* PDF Info */}
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              {/* Chapter Title */}
                              <Typography 
                                variant="body2" 
                                fontWeight={600}
                                sx={{
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  mb: 0.5
                                }}
                              >
                                {pdf.chapterTitle || pdf.name}
                              </Typography>

                              {/* Metadata Row */}
                              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                                <Typography variant="caption" color="text.secondary">
                                  📦 {formatSize(pdf.size)}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  🕐 {formatLastAccessed(pdf.lastOpened)}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  📄 {pdf.totalPages || '?'} pages
                                </Typography>
                                {pdf.storageType === 'indexeddb' && (
                                  <Chip 
                                    label="Cached" 
                                    size="small" 
                                    sx={{ 
                                      height: 18, 
                                      fontSize: '0.65rem',
                                      bgcolor: 'success.light',
                                      color: 'success.dark'
                                    }} 
                                  />
                                )}
                                {pdf.lastPage > 1 && (
                                  <Typography variant="caption" color="primary.main" fontWeight={500}>
                                    Page {pdf.lastPage}
                                  </Typography>
                                )}
                              </Box>

                              {/* Progress Bar (if started reading) */}
                              {pdf.progress > 0 && (
                                <Box sx={{ mt: 1 }}>
                                  <LinearProgress 
                                    variant="determinate" 
                                    value={pdf.progress || 0}
                                    sx={{ height: 3, borderRadius: 2 }}
                                  />
                                </Box>
                              )}
                            </Box>

                            {/* Actions */}
                            <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
                              <Button
                                variant="contained"
                                size="small"
                                onClick={() => onOpenPdf(pdf)}
                              >
                                Open
                              </Button>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleRemove(pdf.id, pdf.name)}
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                            </Box>
                          </Box>
                        );
                      })}
                    </AccordionDetails>
                  </Accordion>
                );
              })}
            </Box>
          )}
        </Box>
      </Container>

      {/* ZIP Extraction Progress Dialog */}
      <Dialog open={zipExtracting} maxWidth="sm" fullWidth>
        <DialogTitle>📦 Extracting ZIP File</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              {zipProgress.message}
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={(zipProgress.current / zipProgress.total) * 100 || 0}
              sx={{ height: 8, borderRadius: 4 }}
            />
            <Typography variant="caption" color="text.secondary" textAlign="center">
              {zipProgress.current} / {zipProgress.total}
            </Typography>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Upload Metadata Dialog */}
      <Dialog open={uploadDialog} onClose={handleCancelUpload} maxWidth="sm" fullWidth>
        <DialogTitle>
          {extractedPdfs.length > 0 
            ? `📦 Add ${extractedPdfs.length} PDFs to Library` 
            : 'Add PDF to Library'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {extractedPdfs.length > 0 ? (
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  📦 Extracted {extractedPdfs.length} PDFs from ZIP
                </Typography>
                <Paper elevation={0} sx={{ p: 1, bgcolor: '#f5f5f5', maxHeight: 150, overflow: 'auto' }}>
                  {extractedPdfs.map((pdf, idx) => (
                    <Typography key={idx} variant="caption" display="block">
                      • {pdf.metadata.title} ({pdf.filename})
                    </Typography>
                  ))}
                </Paper>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                📄 {pendingFile?.name}
              </Typography>
            )}
            
            {extractedPdfs.length > 0 && (
              <TextField
                fullWidth
                label="Book/Collection Name"
                placeholder="e.g., Class 11 Economics"
                value={uploadMetadata.bookName || ''}
                onChange={(e) => setUploadMetadata({ ...uploadMetadata, bookName: e.target.value })}
                helperText="Name for this book/textbook collection"
              />
            )}
            
            <FormControl fullWidth>
              <InputLabel>Subject</InputLabel>
              <Select
                value={uploadMetadata.subject}
                label="Subject"
                onChange={(e) => setUploadMetadata({ ...uploadMetadata, subject: e.target.value })}
              >
                <MenuItem value="Mathematics">Mathematics</MenuItem>
                <MenuItem value="Science">Science</MenuItem>
                <MenuItem value="Physics">Physics</MenuItem>
                <MenuItem value="Chemistry">Chemistry</MenuItem>
                <MenuItem value="Biology">Biology</MenuItem>
                <MenuItem value="English">English</MenuItem>
                <MenuItem value="Hindi">Hindi</MenuItem>
                <MenuItem value="Social Science">Social Science</MenuItem>
                <MenuItem value="History">History</MenuItem>
                <MenuItem value="Geography">Geography</MenuItem>
                <MenuItem value="Economics">Economics</MenuItem>
                <MenuItem value="Computer Science">Computer Science</MenuItem>
                <MenuItem value="Other">Other (Specify below)</MenuItem>
              </Select>
            </FormControl>
            
            {uploadMetadata.subject === 'Other' && (
              <TextField
                fullWidth
                label="Custom Subject"
                placeholder="Enter subject name"
                value={uploadMetadata.customSubject}
                onChange={(e) => setUploadMetadata({ ...uploadMetadata, customSubject: e.target.value })}
              />
            )}
            
            <FormControl fullWidth>
              <InputLabel>Class/Grade (Optional)</InputLabel>
              <Select
                value={uploadMetadata.class}
                label="Class/Grade (Optional)"
                onChange={(e) => setUploadMetadata({ ...uploadMetadata, class: e.target.value })}
              >
                <MenuItem value="">None</MenuItem>
                <MenuItem value="1">Class 1</MenuItem>
                <MenuItem value="2">Class 2</MenuItem>
                <MenuItem value="3">Class 3</MenuItem>
                <MenuItem value="4">Class 4</MenuItem>
                <MenuItem value="5">Class 5</MenuItem>
                <MenuItem value="6">Class 6</MenuItem>
                <MenuItem value="7">Class 7</MenuItem>
                <MenuItem value="8">Class 8</MenuItem>
                <MenuItem value="9">Class 9</MenuItem>
                <MenuItem value="10">Class 10</MenuItem>
                <MenuItem value="11">Class 11</MenuItem>
                <MenuItem value="12">Class 12</MenuItem>
                <MenuItem value="College">College</MenuItem>
                <MenuItem value="University">University</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelUpload}>Cancel</Button>
          <Button 
            onClick={handleConfirmUpload} 
            variant="contained"
            disabled={!uploadMetadata.subject || (uploadMetadata.subject === 'Other' && !uploadMetadata.customSubject)}
          >
            Add to Library
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Library;
