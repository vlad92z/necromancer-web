/**
 * Example: Using Design Tokens and Layout Components
 * 
 * This file demonstrates how to use the centralized design tokens
 * and reusable layout components in your components.
 */

import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../styles/tokens';
import { Stack, Grid, Button, Modal } from '../components/layout';
import { useState } from 'react';

export function DesignTokenExample() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div style={{ 
      padding: `${SPACING.xl}px`,
      backgroundColor: COLORS.ui.background,
      minHeight: '100vh',
    }}>
      {/* Example 1: Using Stack for vertical layout */}
      <Stack direction="vertical" spacing="lg">
        <h1 style={{ 
          color: COLORS.ui.text,
          fontSize: `${TYPOGRAPHY.heading}px`,
        }}>
          Design System Example
        </h1>

        {/* Example 4: Using Button component */}
        <Stack direction="horizontal" spacing="md">
          <Button variant="primary" onClick={() => setIsModalOpen(true)}>
            Open Modal
          </Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="success">Success</Button>
        </Stack>
      </Stack>

      {/* Example 5: Using Modal component */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Example Modal"
        maxWidth={500}
      >
        <Stack spacing="md">
          <p style={{ color: COLORS.ui.text, margin: 0 }}>
            This is an example modal using the design system.
          </p>
          <Button 
            variant="primary" 
            fullWidth
            onClick={() => setIsModalOpen(false)}
          >
            Close
          </Button>
        </Stack>
      </Modal>
    </div>
  );
}
