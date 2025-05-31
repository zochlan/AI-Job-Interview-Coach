import React, { useEffect, useState } from 'react';
import {
  Typography,
  Box,
  CircularProgress,
  Button,
  Menu,
  MenuItem,
  ListItemText,
  Tooltip
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import CheckIcon from '@mui/icons-material/Check';
import { getAvailableModels } from '../utils/groqApi';
import { useThemeContext } from '../contexts/ThemeContext';

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedModel,
  onModelChange
}) => {
  const { mode } = useThemeContext();
  const [models, setModels] = useState<string[]>([]);
  const [defaultModel, setDefaultModel] = useState<string>('llama3-8b-8192');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Menu state
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleModelSelect = (model: string) => {
    onModelChange(model);
    handleClose();
  };

  useEffect(() => {
    const fetchModels = async () => {
      try {
        setLoading(true);
        const { models, default_model } = await getAvailableModels();
        setModels(models);
        setDefaultModel(default_model);

        // If no model is selected, use the default
        if (!selectedModel) {
          onModelChange(default_model);
        }

        setError(null);
      } catch (err) {
        console.error('Error fetching models:', err);
        setError('Failed to load available models');
      } finally {
        setLoading(false);
      }
    };

    fetchModels();
  }, [selectedModel, onModelChange]);

  // Model descriptions for tooltips
  const modelDescriptions: Record<string, string> = {
    // Groq models - Llama
    'llama3-8b-8192': 'Meta\'s Llama 3 (8B) via Groq - good balance of speed and quality',
    'llama3-70b-8192': 'Meta\'s Llama 3 (70B) via Groq - high quality model',

    // Groq models - Mixtral
    'mixtral-8x7b-32768': 'Mistral\'s mixture of experts model via Groq - powerful but efficient',

    // Groq models - Gemma
    'gemma-7b-it': 'Google\'s Gemma (7B) via Groq - lightweight and efficient',

    // Groq models - Claude
    'claude-3-opus-20240229': 'Anthropic\'s Claude 3 Opus via Groq - highest quality',
    'claude-3-sonnet-20240229': 'Anthropic\'s Claude 3 Sonnet via Groq - balanced performance',
    'claude-3-haiku-20240307': 'Anthropic\'s Claude 3 Haiku via Groq - fastest Claude model',

    // Google models
    'gemini-2.0-flash': 'Google\'s Gemini 2.0 Flash - fast and efficient',
    'gemini-2.0-pro': 'Google\'s Gemini 2.0 Pro - high quality and powerful',

    // OpenAI models
    'gpt-3.5-turbo': 'OpenAI\'s GPT-3.5 model - fast and versatile',
    'gpt-4': 'OpenAI\'s most advanced model - high quality but slower',

    // Meta's Llama models
    'llama-3-8b-instruct': 'Meta\'s Llama 3 (8B parameters) - good for basic tasks',
    'llama-3-70b-instruct': 'Meta\'s Llama 3 (70B parameters) - high quality open model',

    // Smaller/faster models
    'phi-3-mini-4k-instruct': 'Microsoft\'s Phi-3 Mini (3.8B) - very small and fast',
    'phi-3-small-8k-instruct': 'Microsoft\'s Phi-3 Small (7B) - compact but capable',
    'mistral-7b-instruct-v0.2': 'Mistral AI\'s 7B model - efficient and high quality',
    'mixtral-8x7b-instruct-v0.1': 'Mistral\'s mixture of experts model - powerful but efficient',
    'qwen2-7b-instruct': 'Alibaba\'s Qwen2 (7B) - balanced performance',
    'qwen2-1.5b-instruct': 'Alibaba\'s Qwen2 (1.5B) - very small and fast'
  };

  if (loading) {
    return (
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        justifyContent: 'center',
        py: 1
      }}>
        <Typography variant="body2" sx={{ color: mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)' }}>
          Loading models
        </Typography>
        <CircularProgress size={16} sx={{ color: mode === 'dark' ? '#90caf9' : '#1976d2' }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Typography
        color="error"
        variant="body2"
        sx={{ textAlign: 'center', py: 1 }}
      >
        {error}
      </Typography>
    );
  }

  const displayModel = selectedModel || defaultModel;

  return (
    <Box sx={{
      width: '100%',
      position: 'relative',
      zIndex: 1200 // Higher z-index to ensure dropdown appears above other elements
    }}>
      <Button
        id="model-selector-button"
        aria-controls={open ? 'model-selector-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={handleClick}
        endIcon={<KeyboardArrowDownIcon />}
        size="small"
        sx={{
          width: '100%',
          justifyContent: 'space-between',
          bgcolor: mode === 'dark' ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.9)',
          color: mode === 'dark' ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.9)',
          border: `1px solid ${mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
          borderRadius: '8px',
          py: 0.5,
          textTransform: 'none',
          fontWeight: 500,
          fontSize: '0.75rem',
          boxShadow: mode === 'dark' ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.1)',
          '&:hover': {
            bgcolor: mode === 'dark' ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,1)',
          }
        }}
      >
        Model: {displayModel}
      </Button>
      <Menu
        id="model-selector-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'model-selector-button',
          dense: true,
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        slotProps={{
          paper: {
            sx: {
              mt: 0.5,
              width: 250,
              maxHeight: 400,
              bgcolor: mode === 'dark' ? '#1e1e2f' : '#ffffff',
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
              borderRadius: '8px',
              border: `1px solid ${mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
              '& .MuiList-root': {
                py: 0.5,
              }
            }
          }
        }}
      >
        {/* Gemini Models */}
        <Typography
          sx={{
            px: 2,
            py: 0.5,
            fontSize: '0.7rem',
            fontWeight: 700,
            color: mode === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            mt: 0.5
          }}
        >
          Gemini Models
        </Typography>
        {models.filter(model => model.includes('gemini')).map((model) => (
          <MenuItem
            key={model}
            onClick={() => handleModelSelect(model)}
            selected={model === displayModel}
            sx={{
              py: 0.75,
              px: 2,
              fontSize: '0.85rem',
              fontWeight: 500,
              display: 'flex',
              justifyContent: 'space-between',
              '&:hover': {
                bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
              },
              '&.Mui-selected': {
                bgcolor: mode === 'dark' ? 'rgba(25, 118, 210, 0.2)' : 'rgba(25, 118, 210, 0.1)',
                '&:hover': {
                  bgcolor: mode === 'dark' ? 'rgba(25, 118, 210, 0.3)' : 'rgba(25, 118, 210, 0.2)',
                }
              }
            }}
          >
            <Tooltip
              title={modelDescriptions[model] || model}
              placement="right"
              arrow
            >
              <ListItemText primary={model} />
            </Tooltip>
            {model === displayModel && (
              <CheckIcon fontSize="small" sx={{ ml: 1, color: mode === 'dark' ? '#90caf9' : '#1976d2' }} />
            )}
          </MenuItem>
        ))}

        {/* Claude Models */}
        <Typography
          sx={{
            px: 2,
            py: 0.5,
            fontSize: '0.7rem',
            fontWeight: 700,
            color: mode === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            mt: 1
          }}
        >
          Claude Models
        </Typography>
        {models.filter(model => model.includes('claude')).map((model) => (
          <MenuItem
            key={model}
            onClick={() => handleModelSelect(model)}
            selected={model === displayModel}
            sx={{
              py: 0.75,
              px: 2,
              fontSize: '0.85rem',
              fontWeight: 500,
              display: 'flex',
              justifyContent: 'space-between',
              '&:hover': {
                bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
              },
              '&.Mui-selected': {
                bgcolor: mode === 'dark' ? 'rgba(25, 118, 210, 0.2)' : 'rgba(25, 118, 210, 0.1)',
                '&:hover': {
                  bgcolor: mode === 'dark' ? 'rgba(25, 118, 210, 0.3)' : 'rgba(25, 118, 210, 0.2)',
                }
              }
            }}
          >
            <Tooltip
              title={modelDescriptions[model] || model}
              placement="right"
              arrow
            >
              <ListItemText primary={model} />
            </Tooltip>
            {model === displayModel && (
              <CheckIcon fontSize="small" sx={{ ml: 1, color: mode === 'dark' ? '#90caf9' : '#1976d2' }} />
            )}
          </MenuItem>
        ))}

        {/* OpenAI Models */}
        <Typography
          sx={{
            px: 2,
            py: 0.5,
            fontSize: '0.7rem',
            fontWeight: 700,
            color: mode === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            mt: 1
          }}
        >
          OpenAI Models
        </Typography>
        {models.filter(model => model.includes('gpt')).map((model) => (
          <MenuItem
            key={model}
            onClick={() => handleModelSelect(model)}
            selected={model === displayModel}
            sx={{
              py: 0.75,
              px: 2,
              fontSize: '0.85rem',
              fontWeight: 500,
              display: 'flex',
              justifyContent: 'space-between',
              '&:hover': {
                bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
              },
              '&.Mui-selected': {
                bgcolor: mode === 'dark' ? 'rgba(25, 118, 210, 0.2)' : 'rgba(25, 118, 210, 0.1)',
                '&:hover': {
                  bgcolor: mode === 'dark' ? 'rgba(25, 118, 210, 0.3)' : 'rgba(25, 118, 210, 0.2)',
                }
              }
            }}
          >
            <Tooltip
              title={modelDescriptions[model] || model}
              placement="right"
              arrow
            >
              <ListItemText primary={model} />
            </Tooltip>
            {model === displayModel && (
              <CheckIcon fontSize="small" sx={{ ml: 1, color: mode === 'dark' ? '#90caf9' : '#1976d2' }} />
            )}
          </MenuItem>
        ))}

        {/* Llama Models */}
        <Typography
          sx={{
            px: 2,
            py: 0.5,
            fontSize: '0.7rem',
            fontWeight: 700,
            color: mode === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            mt: 1
          }}
        >
          Llama Models
        </Typography>
        {models.filter(model => model.includes('llama')).map((model) => (
          <MenuItem
            key={model}
            onClick={() => handleModelSelect(model)}
            selected={model === displayModel}
            sx={{
              py: 0.75,
              px: 2,
              fontSize: '0.85rem',
              fontWeight: 500,
              display: 'flex',
              justifyContent: 'space-between',
              '&:hover': {
                bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
              },
              '&.Mui-selected': {
                bgcolor: mode === 'dark' ? 'rgba(25, 118, 210, 0.2)' : 'rgba(25, 118, 210, 0.1)',
                '&:hover': {
                  bgcolor: mode === 'dark' ? 'rgba(25, 118, 210, 0.3)' : 'rgba(25, 118, 210, 0.2)',
                }
              }
            }}
          >
            <Tooltip
              title={modelDescriptions[model] || model}
              placement="right"
              arrow
            >
              <ListItemText primary={model} />
            </Tooltip>
            {model === displayModel && (
              <CheckIcon fontSize="small" sx={{ ml: 1, color: mode === 'dark' ? '#90caf9' : '#1976d2' }} />
            )}
          </MenuItem>
        ))}

        {/* Smaller Models */}
        <Typography
          sx={{
            px: 2,
            py: 0.5,
            fontSize: '0.7rem',
            fontWeight: 700,
            color: mode === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            mt: 1
          }}
        >
          Smaller Models
        </Typography>
        {models.filter(model =>
          model.includes('phi') ||
          model.includes('gemma') ||
          model.includes('mistral') ||
          model.includes('mixtral') ||
          model.includes('qwen')
        ).map((model) => (
          <MenuItem
            key={model}
            onClick={() => handleModelSelect(model)}
            selected={model === displayModel}
            sx={{
              py: 0.75,
              px: 2,
              fontSize: '0.85rem',
              fontWeight: 500,
              display: 'flex',
              justifyContent: 'space-between',
              '&:hover': {
                bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
              },
              '&.Mui-selected': {
                bgcolor: mode === 'dark' ? 'rgba(25, 118, 210, 0.2)' : 'rgba(25, 118, 210, 0.1)',
                '&:hover': {
                  bgcolor: mode === 'dark' ? 'rgba(25, 118, 210, 0.3)' : 'rgba(25, 118, 210, 0.2)',
                }
              }
            }}
          >
            <Tooltip
              title={modelDescriptions[model] || model}
              placement="right"
              arrow
            >
              <ListItemText primary={model} />
            </Tooltip>
            {model === displayModel && (
              <CheckIcon fontSize="small" sx={{ ml: 1, color: mode === 'dark' ? '#90caf9' : '#1976d2' }} />
            )}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
};

export default ModelSelector;
