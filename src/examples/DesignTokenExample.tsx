/**
 * Example: Using Design Tokens and Layout Components
 * 
 * This file demonstrates how to use the centralized design tokens
 * and reusable layout components in your components.
 */

import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../styles/tokens';
import { Stack, Grid, Button, Card, Modal } from '../components/layout';
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

        {/* Example 2: Using Card component */}
        <Card variant="elevated" padding="lg">
          <Stack spacing="md">
            <h2 style={{ 
              color: COLORS.ui.text,
              fontSize: `${TYPOGRAPHY.large}px`,
              margin: 0,
            }}>
              Card with Stack Layout
            </h2>
            <p style={{ color: COLORS.ui.textMuted, margin: 0 }}>
              This demonstrates using the Card component with Stack inside.
            </p>
          </Stack>
        </Card>

        {/* Example 3: Using Grid for multiple items */}
        <Grid columns={3} gap="md">
          {['Fire', 'Frost', 'Life'].map((rune) => (
            <Card key={rune} variant="outlined" hoverable>
              <Stack spacing="sm" align="center">
                <div style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: RADIUS.round,
                  backgroundColor: COLORS.runes[rune as keyof typeof COLORS.runes],
                  boxShadow: SHADOWS.md,
                }} />
                <span style={{ color: COLORS.ui.text }}>{rune}</span>
              </Stack>
            </Card>
          ))}
        </Grid>

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
